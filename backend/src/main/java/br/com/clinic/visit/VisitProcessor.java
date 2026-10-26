package br.com.clinic.visit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import jakarta.annotation.PreDestroy;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.Instant;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class VisitProcessor {
    private static final Logger log = LoggerFactory.getLogger(VisitProcessor.class);
    private final VisitRepository repository;
    private final HttpBinClient httpBin;
    private final TransactionTemplate transaction;
    private final ExecutorService workers = Executors.newFixedThreadPool(5);
    private final Set<Long> inFlight = ConcurrentHashMap.newKeySet();
    private final long retryDelayMs;

    public VisitProcessor(VisitRepository repository, HttpBinClient httpBin, PlatformTransactionManager manager,
                          @Value("${app.retry-delay-ms}") long retryDelayMs) {
        this.repository = repository;
        this.httpBin = httpBin;
        this.transaction = new TransactionTemplate(manager);
        this.retryDelayMs = retryDelayMs;
    }

    @Scheduled(fixedDelayString = "${app.scheduler-delay-ms}")
    public void enqueuePending() {
        Instant cutoff = Instant.now().minusMillis(retryDelayMs);
        repository.findReadyToProcess(VisitStatus.PENDING, cutoff).forEach(visit -> {
            if (inFlight.add(visit.getId())) {
                workers.submit(() -> {
                    try { process(visit.getId()); }
                    finally { inFlight.remove(visit.getId()); }
                });
            }
        });
    }

    @PreDestroy
    public void shutdown() { workers.shutdown(); }

    private void process(Long id) {
        Visit visit = transaction.execute(status -> repository.findById(id).orElse(null));
        if (visit == null || visit.getStatus() != VisitStatus.PENDING) return;
        Boolean claimed = transaction.execute(status -> {
            Visit current = repository.findById(id).orElse(null);
            if (current == null || current.getStatus() != VisitStatus.PENDING) return false;
            current.startProcessing();
            repository.save(current);
            return true;
        });
        if (!Boolean.TRUE.equals(claimed)) return;

        try {
            String protocol = httpBin.fetchProtocol();
            transaction.executeWithoutResult(status -> repository.findById(id).ifPresent(current -> current.complete(protocol)));
        } catch (Exception exception) {
            log.warn("Não foi possível processar o atendimento {}. Ele será tentado novamente.", id, exception);
            String message = exception.getMessage() == null ? "Erro ao consultar serviço externo." : exception.getMessage();
            transaction.executeWithoutResult(status -> repository.findById(id).ifPresent(current -> current.fail(message.substring(0, Math.min(message.length(), 240)))));
        }
    }
}


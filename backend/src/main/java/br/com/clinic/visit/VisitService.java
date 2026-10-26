package br.com.clinic.visit;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class VisitService {
    private final VisitRepository repository;
    public VisitService(VisitRepository repository) { this.repository = repository; }

    @Transactional
    public VisitResponse create(VisitRequest request) {
        if (!CpfValidator.isValid(request.cpf())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O CPF informado não é válido.");
        }
        Visit visit = new Visit(request.name().trim(), request.cpf().replaceAll("\\D", ""));
        return VisitResponse.from(repository.save(visit));
    }

    @Transactional(readOnly = true)
    public VisitResponse get(long id) {
        return repository.findById(id).map(VisitResponse::from)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Atendimento não encontrado."));
    }

    @Transactional(readOnly = true)
    public List<VisitResponse> list() {
        return repository.findAll().stream().sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .map(VisitResponse::from).toList();
    }
}


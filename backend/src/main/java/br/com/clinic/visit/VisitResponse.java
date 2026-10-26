package br.com.clinic.visit;

import java.time.Instant;

public record VisitResponse(Long id, String name, String cpf, VisitStatus status, String protocol,
                            int attempts, Instant createdAt, Instant updatedAt) {
    public static VisitResponse from(Visit visit) {
        return new VisitResponse(visit.getId(), visit.getName(), visit.getCpf(), visit.getStatus(),
            visit.getProtocol(), visit.getAttempts(), visit.getCreatedAt(), visit.getUpdatedAt());
    }
}


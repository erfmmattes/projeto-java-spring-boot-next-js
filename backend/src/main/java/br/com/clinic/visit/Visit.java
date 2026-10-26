package br.com.clinic.visit;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "visits", indexes = @Index(name = "idx_visit_status_created", columnList = "status, created_at"))
public class Visit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 120)
    private String name;
    @Column(nullable = false, length = 11)
    private String cpf;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VisitStatus status;
    @Column(length = 36)
    private String protocol;
    @Column(length = 240)
    private String lastError;
    @Column(nullable = false)
    private int attempts;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Visit() {}

    public Visit(String name, String cpf) {
        this.name = name;
        this.cpf = cpf;
        this.status = VisitStatus.PENDING;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    void touch() { this.updatedAt = Instant.now(); }

    public void startProcessing() { this.status = VisitStatus.PROCESSING; this.attempts++; this.lastError = null; }
    public void complete(String protocol) { this.protocol = protocol; this.status = VisitStatus.COMPLETED; this.lastError = null; }
    public void fail(String message) { this.status = VisitStatus.PENDING; this.lastError = message; }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCpf() { return cpf; }
    public VisitStatus getStatus() { return status; }
    public String getProtocol() { return protocol; }
    public String getLastError() { return lastError; }
    public int getAttempts() { return attempts; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}


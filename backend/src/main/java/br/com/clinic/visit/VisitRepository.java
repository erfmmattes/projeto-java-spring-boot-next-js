package br.com.clinic.visit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.List;

public interface VisitRepository extends JpaRepository<Visit, Long> {
    @Query("select v from Visit v where v.status = :status and v.updatedAt <= :cutoff order by v.createdAt asc")
    List<Visit> findReadyToProcess(@Param("status") VisitStatus status, @Param("cutoff") Instant cutoff);
}


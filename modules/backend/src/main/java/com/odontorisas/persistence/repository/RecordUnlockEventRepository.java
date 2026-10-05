package com.odontorisas.persistence.repository;

import com.odontorisas.common.UnlockAction;
import com.odontorisas.persistence.entity.RecordUnlockEvent;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecordUnlockEventRepository extends JpaRepository<RecordUnlockEvent, Long> {

    /** Último evento de una acción para la historia (con el ADMIN, para mostrar su nombre). */
    @EntityGraph(attributePaths = "admin")
    Optional<RecordUnlockEvent> findFirstByRecordIdAndActionOrderByCreatedAtDescIdDesc(Long recordId, UnlockAction action);

    List<RecordUnlockEvent> findByRecordIdOrderByIdAsc(Long recordId);
}

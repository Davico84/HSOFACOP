package com.odontorisas.persistence.repository;

import com.odontorisas.persistence.entity.OrthodonticRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OrthodonticRecordRepository
        extends JpaRepository<OrthodonticRecord, Long>, JpaSpecificationExecutor<OrthodonticRecord> {

    /** Último correlativo del autor (0 si no tiene historias). Llamar con la fila del autor bloqueada. */
    @Query("select coalesce(max(r.recordSeq), 0) from OrthodonticRecord r where r.author.id = :authorId")
    int findMaxRecordSeq(@Param("authorId") Long authorId);

    /** Historias creadas por un autor (uso de su cupo). */
    long countByAuthorId(Long authorId);

    /** Historias por autor para una página de cuentas, en una sola consulta (sin N+1). */
    @Query("select r.author.id as authorId, count(r) as total from OrthodonticRecord r "
        + "where r.author.id in :authorIds group by r.author.id")
    List<AuthorRecordCount> countByAuthorIds(@Param("authorIds") Collection<Long> authorIds);

    /** Proyección de {@link #countByAuthorIds}. */
    interface AuthorRecordCount {
        Long getAuthorId();

        long getTotal();
    }

    /** Listado con el autor cargado en la misma consulta (columna "Autor", sin N+1). */
    @Override
    @EntityGraph(attributePaths = "author")
    Page<OrthodonticRecord> findAll(Specification<OrthodonticRecord> spec, Pageable pageable);

    /**
     * Historia con su fila bloqueada hasta el commit: imprimir, guardar, solicitar, descartar y
     * desbloquear se serializan (sin join: FOR UPDATE no admite el lado opcional de un outer join).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from OrthodonticRecord r where r.id = :id")
    Optional<OrthodonticRecord> findByIdForUpdate(@Param("id") Long id);

    /** Historia con su autor cargado (para devolver su nombre). */
    @EntityGraph(attributePaths = "author")
    @Query("select r from OrthodonticRecord r where r.id = :id")
    Optional<OrthodonticRecord> findWithAuthorById(@Param("id") Long id);
}

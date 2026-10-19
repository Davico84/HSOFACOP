package com.odontorisas.persistence.specification;

import com.odontorisas.persistence.entity.OrthodonticRecord;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collection;

/** Filtros del listado de historias (design D5/D6). */
public final class OrthodonticRecordSpecifications {

    private OrthodonticRecordSpecifications() {
    }

    /** Solo las historias de ese autor (alcance de un USER). */
    public static Specification<OrthodonticRecord> authoredBy(Long authorId) {
        return (root, query, cb) -> cb.equal(root.get("author").get("id"), authorId);
    }

    /** Historias cuyos autores son alumnos de alguna de esas turmas (alcance de un COORDINATOR). */
    public static Specification<OrthodonticRecord> authorInCohorts(Collection<Long> cohortIds) {
        return (root, query, cb) -> root.get("author").get("cohort").get("id").in(cohortIds);
    }

    /**
     * {@code search_text} contiene el término. El término debe llegar ya normalizado (minúsculas,
     * sin tildes) como la columna; los comodines de LIKE del usuario se escapan.
     */
    public static Specification<OrthodonticRecord> searchTextContains(String normalizedTerm) {
        String escaped = normalizedTerm.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return (root, query, cb) -> cb.like(root.get("searchText"), "%" + escaped + "%", '\\');
    }
}

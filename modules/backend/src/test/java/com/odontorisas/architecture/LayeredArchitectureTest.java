package com.odontorisas.architecture;

import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Scenario "Capas del backend" (spec project-foundation): la lógica de negocio
 * vive en {@code service.<dominio>} (fuera de {@code infra}); {@code infra} son
 * adaptadores técnicos. Reglas de dependencia:
 * <ul>
 *   <li>{@code presentation} no depende de {@code persistence} (habla con {@code service}).</li>
 *   <li>{@code persistence} no depende de {@code presentation} ni de {@code service} (modelo limpio).</li>
 *   <li>{@code service} no depende de {@code presentation}.</li>
 * </ul>
 * No se restringe {@code infra → service}: la configuración/seguridad es el
 * composition root y cablea servicios legítimamente.
 * <p>
 * Sin {@code allowEmptyShould}: una regla que no encuentra clases debe fallar, no
 * pasar en verde sin comprobar nada (ver docs/testing.md §5).
 */
class LayeredArchitectureTest {

    private final JavaClasses classes = new ClassFileImporter()
        .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
        .importPackages("com.odontorisas");

    /**
     * Guardián del importador: si ArchUnit no sabe leer el bytecode de la versión
     * de Java en uso, falla en silencio e importa cero clases, y todas las reglas
     * pasan sin comprobar nada.
     */
    @Test
    void the_importer_actually_reads_the_bytecode() {
        assertThat(classes)
            .as("ArchUnit importó 0 clases: ¿soporta el bytecode de esta versión de Java?")
            .isNotEmpty();
        assertThat(classes.containPackage("com.odontorisas.service")).isTrue();
        assertThat(classes.containPackage("com.odontorisas.presentation")).isTrue();
        assertThat(classes.containPackage("com.odontorisas.persistence")).isTrue();
    }

    @Test
    void presentation_should_not_depend_on_persistence() {
        ArchRule rule = noClasses()
            .that().resideInAPackage("..presentation..")
            .should().dependOnClassesThat().resideInAPackage("..persistence..");
        rule.check(classes);
    }

    @Test
    void persistence_should_not_depend_on_presentation_or_service() {
        ArchRule rule = noClasses()
            .that().resideInAPackage("..persistence..")
            .should().dependOnClassesThat().resideInAnyPackage("..presentation..", "..service..");
        rule.check(classes);
    }

    @Test
    void service_should_not_depend_on_presentation() {
        ArchRule rule = noClasses()
            .that().resideInAPackage("..service..")
            .should().dependOnClassesThat().resideInAPackage("..presentation..");
        rule.check(classes);
    }
}

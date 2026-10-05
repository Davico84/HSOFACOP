package com.odontorisas.presentation.controller;

import com.odontorisas.infra.security.JwtAuthenticationFilter;
import com.odontorisas.service.records.OrthodonticRecordService;
import com.odontorisas.service.records.RecordActor;
import com.odontorisas.service.records.RecordData;
import com.odontorisas.service.records.RecordNotFoundException;
import com.odontorisas.service.records.RecordSummaryView;
import com.odontorisas.service.records.RecordView;
import com.odontorisas.service.records.StaleRecordException;
import com.odontorisas.service.records.content.RecordContent;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Forma de la API de historias sin BD: sesión requerida, validación por campo (400), mapeo de
 * 404/409 y paginación con orden fijo. Service mockeado.
 */
@WebMvcTest(controllers = OrthodonticRecordsController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class))
@AutoConfigureMockMvc(addFilters = false)
@Import(OrthodonticRecordsControllerTest.MethodSecurity.class)
class OrthodonticRecordsControllerTest {

    @TestConfiguration
    @EnableMethodSecurity
    static class MethodSecurity {
    }

    @Autowired MockMvc mockMvc;
    @MockitoBean OrthodonticRecordService service;

    private static final RecordView ANA = new RecordView(10L, "AEO-001", 1L, "Dra. María Torres", "Dra. María Torres",
        "Ana Quispe", null, null, null, LocalDate.of(2012, 5, 20), null, null, null, LocalDate.of(2026, 5, 19), 13,
        RecordContent.empty(), null, null, 2L, Instant.parse("2026-10-01T10:00:00Z"), Instant.parse("2026-10-01T10:00:00Z"));

    private static RequestPostProcessor as(long userId, String role) {
        var auth = new UsernamePasswordAuthenticationToken("u" + userId, null,
            List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        auth.setDetails(userId);
        // Sin filtros, el contexto de seguridad se fija aquí (mismo hilo que MockMvc).
        return request -> {
            SecurityContextHolder.getContext().setAuthentication(auth);
            return request;
        };
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private ResultActions create(String body) throws Exception {
        return mockMvc.perform(post("/api/orthodontic-records").with(as(1, "USER"))
            .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private ResultActions update(String body) throws Exception {
        return mockMvc.perform(put("/api/orthodontic-records/10").with(as(1, "USER"))
            .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    // --- Sesión ---

    @Test
    void without_session_is_401_and_nothing_is_created() throws Exception {
        mockMvc.perform(post("/api/orthodontic-records").contentType(MediaType.APPLICATION_JSON)
                .content("{\"patientName\":\"Ana\"}"))
            .andExpect(status().isUnauthorized());
        verify(service, never()).create(any(), any(), any());
    }

    // --- Creación ---

    @Test
    void creates_with_only_the_patient_name_as_the_authenticated_user() throws Exception {
        when(service.create(any(), any(), any())).thenReturn(ANA);

        create("{\"patientName\":\"Ana Quispe\"}")
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(10))
            .andExpect(jsonPath("$.recordNumber").value("AEO-001"))
            .andExpect(jsonPath("$.ageYears").value(13))
            .andExpect(jsonPath("$.content.anamnesis").exists());
        verify(service).create(eq(new RecordActor(1L, false)), any(RecordData.class), isNull());
    }

    @Test
    void blank_patient_name_is_400_on_its_field() throws Exception {
        create("{\"patientName\":\"   \"}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.type").value("/errors/validation-error"))
            .andExpect(jsonPath("$.errors[0].field").value("patientName"))
            .andExpect(jsonPath("$.errors[0].message").value("Indica el nombre del paciente."));
        verify(service, never()).create(any(), any(), any());
    }

    @Test
    void valid_documents_by_type_are_accepted() throws Exception {
        when(service.create(any(), any(), any())).thenReturn(ANA);
        create("{\"patientName\":\"A\",\"documentType\":\"DNI\",\"documentNumber\":\"74125896\"}").andExpect(status().isCreated());
        create("{\"patientName\":\"A\",\"documentType\":\"FOREIGNER_CARD\",\"documentNumber\":\"001234567\"}").andExpect(status().isCreated());
        create("{\"patientName\":\"A\",\"documentType\":\"PASSPORT\",\"documentNumber\":\"12345678\"}").andExpect(status().isCreated());
    }

    @Test
    void document_with_wrong_format_is_400_on_the_number() throws Exception {
        create("{\"patientName\":\"A\",\"documentType\":\"DNI\",\"documentNumber\":\"7412589\"}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("documentNumber"))
            .andExpect(jsonPath("$.errors[0].message").value("El DNI debe tener 8 dígitos."));
        create("{\"patientName\":\"A\",\"documentType\":\"FOREIGNER_CARD\",\"documentNumber\":\"00123456A\"}")
            .andExpect(status().isBadRequest());
        create("{\"patientName\":\"A\",\"documentType\":\"PASSPORT\",\"documentNumber\":\"AB1234\"}")
            .andExpect(status().isBadRequest());
        create("{\"patientName\":\"A\",\"documentType\":\"PASSPORT\",\"documentNumber\":\"12345\"}")
            .andExpect(status().isBadRequest());
    }

    @Test
    void document_number_without_type_and_type_without_number_are_400() throws Exception {
        create("{\"patientName\":\"A\",\"documentNumber\":\"74125896\"}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("documentType"));
        create("{\"patientName\":\"A\",\"documentType\":\"DNI\"}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("documentNumber"));
    }

    @Test
    void future_birth_date_is_400() throws Exception {
        create("{\"patientName\":\"A\",\"birthDate\":\"" + LocalDate.now().plusDays(1) + "\"}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("birthDate"));
    }

    @Test
    void treatment_start_before_birth_is_400_on_the_start_date() throws Exception {
        create("{\"patientName\":\"A\",\"birthDate\":\"2012-05-20\",\"treatmentStartDate\":\"2012-05-19\"}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("treatmentStartDate"));
    }

    // --- Límites del contenido ---

    @Test
    void long_text_over_limit_is_400_with_its_path() throws Exception {
        String tooLong = "x".repeat(4001);
        create("{\"patientName\":\"A\",\"content\":{\"anamnesis\":{\"chiefComplaint\":\"" + tooLong + "\"}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.anamnesis.chiefComplaint"));
    }

    @Test
    void percent_and_millimeters_out_of_range_are_400() throws Exception {
        create("{\"patientName\":\"A\",\"content\":{\"occlusal\":{\"deepBitePercent\":101}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.occlusal.deepBitePercent"));
        create("{\"patientName\":\"A\",\"content\":{\"occlusal\":{\"overjetMm\":31}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.occlusal.overjetMm"));
    }

    @Test
    void model_measures_out_of_range_or_with_two_decimals_are_400() throws Exception {
        create("{\"patientName\":\"A\",\"content\":{\"models\":{\"transversal\":{\"intermolarUpper\":100}}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.models.transversal.intermolarUpper"));
        create("{\"patientName\":\"A\",\"content\":{\"models\":{\"transversal\":{\"walaToEv\":{\"firstMolar\":2.25}}}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.models.transversal.walaToEv.firstMolar"));
        create("{\"patientName\":\"A\",\"content\":{\"models\":{\"transversal\":{\"intercanineLower\":-1}}}}")
            .andExpect(status().isBadRequest());
        create("{\"patientName\":\"A\",\"content\":{\"models\":{\"moyers\":{\"lowerIncisors\":{\"tooth31\":5.45}}}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.models.moyers.lowerIncisors.tooth31"));
        create("{\"patientName\":\"A\",\"content\":{\"models\":{\"moyers\":{\"availableSpace\":{\"maxillaLeft\":100}}}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.models.moyers.availableSpace.maxillaLeft"));
        create("{\"patientName\":\"A\",\"content\":{\"models\":{\"moyers\":{\"crowdingPositive\":\"" + "x".repeat(201) + "\"}}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.models.moyers.crowdingPositive"));
    }

    @Test
    void nance_measures_out_of_range_and_future_date_are_400() throws Exception {
        create("{\"patientName\":\"A\",\"content\":{\"models\":{\"nance\":{\"upperWidths\":{\"tooth21\":8.55}}}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.models.nance.upperWidths.tooth21"));
        create("{\"patientName\":\"A\",\"content\":{\"models\":{\"nance\":{\"availableLower\":100}}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.models.nance.availableLower"));
        String tomorrow = java.time.LocalDate.now().plusDays(1).toString();
        create("{\"patientName\":\"A\",\"content\":{\"models\":{\"nance\":{\"analysisDate\":\"" + tomorrow + "\"}}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.models.nance.analysisDate"));
    }

    @Test
    void bolton_molar_out_of_range_and_future_date_are_400() throws Exception {
        create("{\"patientName\":\"A\",\"content\":{\"models\":{\"bolton\":{\"firstMolars\":{\"tooth46\":10.25}}}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.models.bolton.firstMolars.tooth46"));
        String tomorrow = java.time.LocalDate.now().plusDays(1).toString();
        create("{\"patientName\":\"A\",\"content\":{\"models\":{\"bolton\":{\"analysisDate\":\"" + tomorrow + "\"}}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.models.bolton.analysisDate"));
    }

    @Test
    void tooth_widths_outside_4_to_13_mm_are_400() throws Exception {
        create("{\"patientName\":\"A\",\"content\":{\"models\":{\"moyers\":{\"lowerIncisors\":{\"tooth42\":3.9}}}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.models.moyers.lowerIncisors.tooth42"));
        create("{\"patientName\":\"A\",\"content\":{\"models\":{\"nance\":{\"lowerWidths\":{\"tooth35\":13.1}}}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.models.nance.lowerWidths.tooth35"));
        create("{\"patientName\":\"A\",\"content\":{\"models\":{\"bolton\":{\"incisors\":{\"tooth21\":0.3}}}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.models.bolton.incisors.tooth21"));
    }

    @Test
    void moyers_date_in_the_future_is_400() throws Exception {
        String tomorrow = java.time.LocalDate.now().plusDays(1).toString();
        create("{\"patientName\":\"A\",\"content\":{\"models\":{\"moyers\":{\"analysisDate\":\"" + tomorrow + "\"}}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.models.moyers.analysisDate"));
    }

    @Test
    void deviated_midline_needs_at_least_half_a_millimeter() throws Exception {
        create("{\"patientName\":\"A\",\"content\":{\"occlusal\":{\"midlineLower\":{\"position\":\"DEVIATED_LEFT\",\"deviationMm\":0.4}}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.occlusal.midlineLower.deviationMm"));
        create("{\"patientName\":\"A\",\"content\":{\"occlusal\":{\"midlineLower\":{\"position\":\"DEVIATED_LEFT\"}}}}")
            .andExpect(status().isBadRequest());
    }

    @Test
    void invalid_fdi_tooth_is_400() throws Exception {
        create("{\"patientName\":\"A\",\"content\":{\"functional\":{\"bruxismTeeth\":[16,49]}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.functional.bruxismTeeth[1]"));
        create("{\"patientName\":\"A\",\"content\":{\"occlusal\":{\"anteriorCrossbiteTeeth\":[14]}}}")
            .andExpect(status().isBadRequest());
    }

    @Test
    void lists_over_their_limits_are_400() throws Exception {
        String items = String.join(",", java.util.Collections.nCopies(31, "\"p\""));
        create("{\"patientName\":\"A\",\"content\":{\"diagnosis\":{\"problemList\":[" + items + "]}}}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("content.diagnosis.problemList"));
        create("{\"patientName\":\"A\",\"content\":{\"diagnosis\":{\"treatmentGoals\":[\"" + "x".repeat(501) + "\"]}}}")
            .andExpect(status().isBadRequest());
    }

    // --- Lectura, guardado y errores de negocio ---

    @Test
    void get_returns_the_record() throws Exception {
        when(service.get(new RecordActor(1L, false), 10L)).thenReturn(ANA);
        mockMvc.perform(get("/api/orthodontic-records/10").with(as(1, "USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.patientName").value("Ana Quispe"))
            .andExpect(jsonPath("$.version").value(2));
    }

    @Test
    void someone_elses_or_missing_record_is_404() throws Exception {
        when(service.get(any(), eq(10L))).thenThrow(new RecordNotFoundException());
        mockMvc.perform(get("/api/orthodontic-records/10").with(as(2, "USER")))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.type").value("/errors/record-not-found"));
    }

    @Test
    void update_passes_version_and_actor_admin_flag() throws Exception {
        when(service.update(any(), anyLong(), anyLong(), any(), any(), any())).thenReturn(ANA);
        mockMvc.perform(put("/api/orthodontic-records/10").with(as(9, "ADMIN"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"version\":2,\"patientName\":\"Ana\",\"recordNumber\":\"AEO-999\"}"))
            .andExpect(status().isOk());
        verify(service).update(eq(new RecordActor(9L, true)), eq(10L), eq(2L), any(RecordData.class), isNull(), isNull());
    }

    @Test
    void update_passes_last_step() throws Exception {
        when(service.update(any(), anyLong(), anyLong(), any(), any(), any())).thenReturn(ANA);
        update("{\"version\":2,\"patientName\":\"Ana\",\"lastStep\":6}").andExpect(status().isOk());
        verify(service).update(eq(new RecordActor(1L, false)), eq(10L), eq(2L), any(RecordData.class), eq(6), isNull());
    }

    @Test
    void filled_steps_out_of_range_is_400() throws Exception {
        update("{\"version\":2,\"patientName\":\"Ana\",\"filledSteps\":[1,9]}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value(org.hamcrest.Matchers.startsWith("filledSteps")));
        create("{\"patientName\":\"Ana\",\"filledSteps\":[0]}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value(org.hamcrest.Matchers.startsWith("filledSteps")));
        verify(service, never()).update(any(), anyLong(), anyLong(), any(), any(), any());
        verify(service, never()).create(any(), any(), any());
    }

    @Test
    void repeated_filled_steps_is_400() throws Exception {
        update("{\"version\":2,\"patientName\":\"Ana\",\"filledSteps\":[1,1,2]}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("filledSteps"));
        verify(service, never()).update(any(), anyLong(), anyLong(), any(), any(), any());
    }

    @Test
    void update_passes_filled_steps() throws Exception {
        when(service.update(any(), anyLong(), anyLong(), any(), any(), any())).thenReturn(ANA);
        update("{\"version\":2,\"patientName\":\"Ana\",\"filledSteps\":[1,2,5]}").andExpect(status().isOk());
        verify(service).update(eq(new RecordActor(1L, false)), eq(10L), eq(2L), any(RecordData.class), isNull(),
            eq(List.of(1, 2, 5)));
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 9})
    void last_step_out_of_range_is_400(int step) throws Exception {
        update("{\"version\":2,\"patientName\":\"Ana\",\"lastStep\":" + step + "}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("lastStep"));
        verify(service, never()).update(any(), anyLong(), anyLong(), any(), any());
    }

    @Test
    void update_without_version_is_400() throws Exception {
        update("{\"patientName\":\"Ana\"}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("version"));
    }

    @Test
    void stale_version_is_409_with_its_type() throws Exception {
        when(service.update(any(), anyLong(), anyLong(), any(), any(), any())).thenThrow(new StaleRecordException());
        update("{\"version\":1,\"patientName\":\"Ana\"}")
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.type").value("/errors/stale-record"));
    }

    // --- Listado ---

    @Test
    void list_uses_fixed_sort_capped_size_and_search_term() throws Exception {
        RecordSummaryView row = new RecordSummaryView(10L, "AEO-001", "Ana Quispe", null, null, "Dra. Torres",
            null, "Dra. Torres", Instant.parse("2026-10-01T10:00:00Z"));
        when(service.list(any(), eq("quispe"), any(Pageable.class))).thenAnswer(inv ->
            new PageImpl<>(List.of(row), inv.getArgument(2), 1));

        mockMvc.perform(get("/api/orthodontic-records").with(as(1, "USER"))
                .param("q", "quispe").param("size", "500").param("sort", "patientName"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].recordNumber").value("AEO-001"))
            .andExpect(jsonPath("$.content[0].authorName").value("Dra. Torres"))
            .andExpect(jsonPath("$.size").value(100));
        verify(service).list(eq(new RecordActor(1L, false)), eq("quispe"),
            eq(org.springframework.data.domain.PageRequest.of(0, 100,
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Order.desc("updatedAt"),
                    org.springframework.data.domain.Sort.Order.desc("id")))));
    }
}

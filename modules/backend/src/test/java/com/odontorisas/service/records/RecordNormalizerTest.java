package com.odontorisas.service.records;

import com.odontorisas.common.DocumentType;
import com.odontorisas.common.PatientSex;
import com.odontorisas.service.records.content.AfaiChange;
import com.odontorisas.service.records.content.Anamnesis;
import com.odontorisas.service.records.content.AngleClass;
import com.odontorisas.service.records.content.AngleRelation;
import com.odontorisas.service.records.content.AvailableSpace;
import com.odontorisas.service.records.content.BoltonAnalysis;
import com.odontorisas.service.records.content.Diagnosis;
import com.odontorisas.service.records.content.FacialAnalysis.FacialPattern;
import com.odontorisas.service.records.content.FacialAnalysis.PatternIIFeature;
import com.odontorisas.service.records.content.FacialAnalysis;
import com.odontorisas.service.records.content.FirstMolarWidths;
import com.odontorisas.service.records.content.FunctionalAnalysis.Bruxism;
import com.odontorisas.service.records.content.FunctionalAnalysis.SuckingHabit;
import com.odontorisas.service.records.content.FunctionalAnalysis.TongueActivity;
import com.odontorisas.service.records.content.FunctionalAnalysis;
import com.odontorisas.service.records.content.LowerArchWidths;
import com.odontorisas.service.records.content.LowerIncisors;
import com.odontorisas.service.records.content.Midline;
import com.odontorisas.service.records.content.ModelAnalysis;
import com.odontorisas.service.records.content.MoyersAnalysis;
import com.odontorisas.service.records.content.NanceAnalysis;
import com.odontorisas.service.records.content.OcclusalAnalysis.SpeeCurve;
import com.odontorisas.service.records.content.OcclusalAnalysis.Transverse;
import com.odontorisas.service.records.content.OcclusalAnalysis.Vertical;
import com.odontorisas.service.records.content.OcclusalAnalysis;
import com.odontorisas.service.records.content.Presence;
import com.odontorisas.service.records.content.RadiographicAnalysis.CephalometricAnalysis;
import com.odontorisas.service.records.content.RadiographicAnalysis;
import com.odontorisas.service.records.content.RecordContent;
import com.odontorisas.service.records.content.Side;
import com.odontorisas.service.records.content.SideRelations;
import com.odontorisas.service.records.content.Signatures;
import com.odontorisas.service.records.content.TransversalAnalysis;
import com.odontorisas.service.records.content.UpperArchWidths;
import com.odontorisas.service.records.content.WalaToEv;
import com.odontorisas.service.records.content.YesNo;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Normalización antes de guardar: textos recortados y campos condicionados descartados cuando su
 * condición no se cumple (scenarios de "Secciones clínicas de la fase 1").
 */
class RecordNormalizerTest {

    private static RecordContent with(Anamnesis a, FacialAnalysis f, FunctionalAnalysis fn, OcclusalAnalysis o,
                                      RadiographicAnalysis r, Diagnosis d, Signatures s) {
        RecordContent e = RecordContent.empty();
        return new RecordContent(null, a != null ? a : e.anamnesis(), f != null ? f : e.facial(),
            fn != null ? fn : e.functional(), o != null ? o : e.occlusal(), e.models(), r != null ? r : e.radiographic(),
            d != null ? d : e.diagnosis(), s != null ? s : e.signatures());
    }

    private static RecordData data(PatientSex sex, RecordContent content) {
        return new RecordData("  Dra. Torres ", " Ana Quispe ", DocumentType.DNI, " 74125896 ", sex,
            null, "", "   ", null, null, content);
    }

    // --- Datos del paciente ---

    @Test
    void trims_texts_and_blank_becomes_null() {
        RecordData out = RecordNormalizer.normalize(data(PatientSex.FEMALE, null), null);
        assertThat(out.patientName()).isEqualTo("Ana Quispe");
        assertThat(out.treatingDentist()).isEqualTo("Dra. Torres");
        assertThat(out.documentNumber()).isEqualTo("74125896");
        assertThat(out.birthPlace()).isNull();
        assertThat(out.address()).isNull();
    }

    @Test
    void missing_content_becomes_all_sections_empty_with_schema_version() {
        RecordContent out = RecordNormalizer.normalize(data(PatientSex.FEMALE, null), null).content();
        assertThat(out.schemaVersion()).isEqualTo(RecordContent.CURRENT_SCHEMA_VERSION);
        assertThat(out.anamnesis()).isNotNull();
        assertThat(out.signatures()).isNotNull();
        assertThat(out.functional().suckingHabitTypes()).containsExactly(SuckingHabit.NONE);
    }

    // --- Anamnesis ---

    @Test
    void menarche_is_kept_only_for_female_patients() {
        Anamnesis a = new Anamnesis(null, null, null, null, null, YesNo.NO, null, null, null, null, null);
        assertThat(RecordNormalizer.content(with(a, null, null, null, null, null, null), PatientSex.FEMALE, null)
            .anamnesis().menarche()).isEqualTo(YesNo.NO);
        assertThat(RecordNormalizer.content(with(a, null, null, null, null, null, null), PatientSex.MALE, null)
            .anamnesis().menarche()).isNull();
        assertThat(RecordNormalizer.content(with(a, null, null, null, null, null, null), null, null)
            .anamnesis().menarche()).isNull();
    }

    // --- Análisis facial ---

    private static FacialAnalysis facial(FacialPattern pattern) {
        return new FacialAnalysis(null, null, Presence.ABSENT, "  Tercio inferior aumentado ", null, null,
            Presence.ABSENT, "   ", null, null, null, null, null, null, null,
            pattern, List.of(PatternIIFeature.MAXILLARY_PROTRUSION, PatternIIFeature.MANDIBULAR_RETRUSION),
            AfaiChange.INCREASED, List.of(), AfaiChange.DECREASED);
    }

    @Test
    void facial_notes_are_trimmed_and_blank_becomes_null() {
        FacialAnalysis out = RecordNormalizer.facial(facial(null));
        assertThat(out.facialThirds()).isEqualTo(Presence.ABSENT);
        assertThat(out.facialThirdsNotes()).isEqualTo("Tercio inferior aumentado");
        assertThat(out.restSymmetryNotes()).isNull();
    }

    @Test
    void pattern_features_only_for_their_pattern() {
        FacialAnalysis ii = RecordNormalizer.facial(facial(FacialPattern.PATTERN_II));
        assertThat(ii.patternIIFeatures()).containsExactly(PatternIIFeature.MANDIBULAR_RETRUSION, PatternIIFeature.MAXILLARY_PROTRUSION);
        assertThat(ii.patternIIAfai()).isEqualTo(AfaiChange.INCREASED);
        assertThat(ii.patternIIIAfai()).isNull();

        FacialAnalysis i = RecordNormalizer.facial(facial(FacialPattern.PATTERN_I));
        assertThat(i.patternIIFeatures()).isEmpty();
        assertThat(i.patternIIAfai()).isNull();
    }

    // --- Análisis funcional ---

    private static FunctionalAnalysis functional(TongueActivity tongue, List<SuckingHabit> habits, Bruxism bruxism,
                                                 List<Integer> teeth) {
        return new FunctionalAnalysis(null, null, null, tongue, List.of(Side.RIGHT), null, null, null, null,
            habits, null, null, bruxism, teeth);
    }

    @Test
    void tongue_sides_only_with_lateral_interposition() {
        assertThat(RecordNormalizer.functional(functional(TongueActivity.LATERAL_INTERPOSITION, null, null, null), null)
            .tongueLateralSides()).containsExactly(Side.RIGHT);
        assertThat(RecordNormalizer.functional(functional(TongueActivity.ANTERIOR_INTERPOSITION, null, null, null), null)
            .tongueLateralSides()).isEmpty();
    }

    @Test
    void sucking_habits_none_is_default_and_exclusive() {
        assertThat(RecordNormalizer.suckingHabits(List.of(), YesNo.YES)).containsExactly(SuckingHabit.NONE);
        assertThat(RecordNormalizer.suckingHabits(List.of(SuckingHabit.NONE, SuckingHabit.NAIL_BITING, SuckingHabit.FINGERS), YesNo.YES))
            .containsExactly(SuckingHabit.FINGERS, SuckingHabit.NAIL_BITING);
    }

    @Test
    void sucking_habits_are_fixed_to_none_when_anamnesis_says_no() {
        assertThat(RecordNormalizer.suckingHabits(List.of(SuckingHabit.FINGERS), YesNo.NO)).containsExactly(SuckingHabit.NONE);
    }

    @Test
    void bruxism_teeth_only_with_wear_valid_fdi_sorted() {
        List<Integer> teeth = new ArrayList<>(Arrays.asList(26, 13, 55, 13, null));
        assertThat(RecordNormalizer.functional(functional(null, null, Bruxism.WITH_WEAR, teeth), null).bruxismTeeth())
            .containsExactly(13, 26, 55);
        assertThat(RecordNormalizer.functional(functional(null, null, Bruxism.WITHOUT_WEAR, teeth), null).bruxismTeeth())
            .isEmpty();
    }

    // --- Análisis oclusal ---

    private static OcclusalAnalysis occlusal(Transverse transverse, Vertical vertical, SpeeCurve spee, Boolean apNormal,
                                             Boolean mi, YesNo family) {
        SideRelations rel = new SideRelations(new AngleRelation(AngleClass.CLASS_II, " ½ cúspide "), new AngleRelation(null, " "));
        return new OcclusalAnalysis(transverse, Side.LEFT, null, vertical, new BigDecimal("60"), new BigDecimal("3"),
            spee, " acentuada ", apNormal, new BigDecimal("6"), List.of(42, 12), new Midline(Midline.Position.CENTERED, new BigDecimal("2")),
            new Midline(Midline.Position.DEVIATED_LEFT, new BigDecimal("2")), rel, null, mi, rel, null, rel, null, null,
            family, " Padre ");
    }

    @Test
    void crossbite_side_only_when_unilateral() {
        assertThat(RecordNormalizer.occlusal(occlusal(Transverse.UNILATERAL_POSTERIOR_CROSSBITE, null, null, null, null, null))
            .crossbiteSide()).isEqualTo(Side.LEFT);
        assertThat(RecordNormalizer.occlusal(occlusal(Transverse.BRODIE, null, null, null, null, null)).crossbiteSide()).isNull();
    }

    @Test
    void bite_values_only_for_their_vertical_option() {
        OcclusalAnalysis deep = RecordNormalizer.occlusal(occlusal(null, Vertical.DEEP_BITE, null, null, null, null));
        assertThat(deep.deepBitePercent()).isEqualByComparingTo("60");
        assertThat(deep.openBiteMm()).isNull();
        OcclusalAnalysis open = RecordNormalizer.occlusal(occlusal(null, Vertical.OPEN_BITE, null, null, null, null));
        assertThat(open.deepBitePercent()).isNull();
        assertThat(open.openBiteMm()).isEqualByComparingTo("3");
    }

    @Test
    void spee_detail_only_when_altered() {
        assertThat(RecordNormalizer.occlusal(occlusal(null, null, SpeeCurve.ALTERED, null, null, null)).speeCurveDetail())
            .isEqualTo("acentuada");
        assertThat(RecordNormalizer.occlusal(occlusal(null, null, SpeeCurve.NORMAL, null, null, null)).speeCurveDetail())
            .isNull();
    }

    @Test
    void anteroposterior_normal_discards_overjet_and_anterior_crossbite() {
        OcclusalAnalysis normal = RecordNormalizer.occlusal(occlusal(null, null, null, true, null, null));
        assertThat(normal.overjetMm()).isNull();
        assertThat(normal.anteriorCrossbiteTeeth()).isEmpty();
        OcclusalAnalysis notNormal = RecordNormalizer.occlusal(occlusal(null, null, null, false, null, null));
        assertThat(notNormal.anteroposteriorNormal()).isNull();
        assertThat(notNormal.overjetMm()).isEqualByComparingTo("6");
        assertThat(notNormal.anteriorCrossbiteTeeth()).containsExactly(12, 42);
    }

    @Test
    void centered_midline_has_no_millimeters() {
        OcclusalAnalysis out = RecordNormalizer.occlusal(occlusal(null, null, null, null, null, null));
        assertThat(out.midlineUpper().deviationMm()).isNull();
        assertThat(out.midlineLower().deviationMm()).isEqualByComparingTo("2");
    }

    @Test
    void relations_trim_detail_and_drop_empty_sides() {
        SideRelations out = RecordNormalizer.occlusal(occlusal(null, null, null, null, null, null)).canineRelation();
        assertThat(out.right()).isEqualTo(new AngleRelation(AngleClass.CLASS_II, "½ cúspide"));
        assertThat(out.left()).isNull();
    }

    @Test
    void rc_relations_only_when_their_box_is_checked() {
        OcclusalAnalysis mi = RecordNormalizer.occlusal(occlusal(null, null, null, null, true, null));
        assertThat(mi.canineRelationMi()).isNotNull();
        assertThat(mi.canineRelationMih()).isNull();
        assertThat(mi.mihDiffersFromRc()).isNull();
    }

    @Test
    void family_who_only_when_yes() {
        assertThat(RecordNormalizer.occlusal(occlusal(null, null, null, null, null, YesNo.YES)).familyMalocclusionWho())
            .isEqualTo("Padre");
        assertThat(RecordNormalizer.occlusal(occlusal(null, null, null, null, null, YesNo.NO)).familyMalocclusionWho())
            .isNull();
    }

    // --- Análisis de modelos ---

    @Test
    void models_section_is_filled_when_missing_and_interpretation_is_trimmed() {
        RecordContent e = RecordContent.empty();
        RecordContent withoutModels = new RecordContent(1, e.anamnesis(), e.facial(), e.functional(), e.occlusal(), null,
            e.radiographic(), e.diagnosis(), e.signatures());
        RecordContent out = RecordNormalizer.content(withoutModels, null, null);
        assertThat(out.models().transversal()).isNotNull();
        assertThat(out.models().transversal().walaToEv()).isNotNull();
        assertThat(out.models().moyers()).isEqualTo(MoyersAnalysis.empty());
        assertThat(out.models().nance()).isEqualTo(NanceAnalysis.empty());
        assertThat(out.models().bolton()).isEqualTo(BoltonAnalysis.empty());
        assertThat(out.schemaVersion()).isEqualTo(6);

        TransversalAnalysis t = new TransversalAnalysis(new BigDecimal("34.5"), null, new BigDecimal("50.1"), null,
            null, null, null, new BigDecimal("50.0"), null, "  Compresión maxilar leve ");
        TransversalAnalysis kept = RecordNormalizer.models(new ModelAnalysis(t, null, null, null)).transversal();
        assertThat(kept.intermolarUpper()).isEqualByComparingTo("50.1");
        assertThat(kept.xIdealWidth()).isEqualByComparingTo("50.0");
        assertThat(kept.walaToEv()).isEqualTo(WalaToEv.empty());
        assertThat(kept.interpretation()).isEqualTo("Compresión maxilar leve");
    }

    @Test
    void moyers_subsection_is_filled_when_missing_and_its_parts_kept() {
        ModelAnalysis withoutMoyers = new ModelAnalysis(TransversalAnalysis.empty(), null, null, null);
        assertThat(RecordNormalizer.models(withoutMoyers).moyers()).isEqualTo(MoyersAnalysis.empty());

        LowerIncisors incisors = new LowerIncisors(new BigDecimal("6.0"), new BigDecimal("5.5"), null, null);
        MoyersAnalysis y = new MoyersAnalysis(LocalDate.of(2026, 9, 1), incisors, null, " ", null, " Mandíbula derecho ",
            "  Discrepancia negativa ");
        MoyersAnalysis kept = RecordNormalizer.models(new ModelAnalysis(null, y, null, null)).moyers();
        assertThat(kept.analysisDate()).isEqualTo(LocalDate.of(2026, 9, 1));
        assertThat(kept.lowerIncisors()).isEqualTo(incisors);
        assertThat(kept.availableSpace()).isEqualTo(AvailableSpace.empty());
        assertThat(kept.crowdingPositive()).isNull();
        assertThat(kept.crowdingNegative()).isEqualTo("Mandíbula derecho");
        assertThat(kept.interpretation()).isEqualTo("Discrepancia negativa");
    }

    @Test
    void nance_subsection_is_filled_when_missing_and_texts_trimmed() {
        assertThat(RecordNormalizer.models(new ModelAnalysis(null, null, null, null)).nance()).isEqualTo(NanceAnalysis.empty());

        NanceAnalysis n = new NanceAnalysis(LocalDate.of(2026, 9, 1), new BigDecimal("70.5"), null, null, null,
            "  Falta de espacio leve ", " ", " Discrepancia negativa ");
        NanceAnalysis kept = RecordNormalizer.models(new ModelAnalysis(null, null, n, null)).nance();
        assertThat(kept.availableUpper()).isEqualByComparingTo("70.5");
        assertThat(kept.upperWidths()).isEqualTo(UpperArchWidths.empty());
        assertThat(kept.lowerWidths()).isEqualTo(LowerArchWidths.empty());
        assertThat(kept.conclusionUpper()).isEqualTo("Falta de espacio leve");
        assertThat(kept.conclusionLower()).isNull();
        assertThat(kept.interpretation()).isEqualTo("Discrepancia negativa");
    }

    @Test
    void bolton_subsection_is_filled_when_missing_and_interpretation_trimmed() {
        assertThat(RecordNormalizer.models(new ModelAnalysis(null, null, null, null)).bolton()).isEqualTo(BoltonAnalysis.empty());

        BoltonAnalysis b = new BoltonAnalysis(LocalDate.of(2026, 9, 1), null, "  Exceso mandibular ");
        BoltonAnalysis kept = RecordNormalizer.models(new ModelAnalysis(null, null, null, b)).bolton();
        assertThat(kept.analysisDate()).isEqualTo(LocalDate.of(2026, 9, 1));
        assertThat(kept.firstMolars()).isEqualTo(FirstMolarWidths.empty());
        assertThat(kept.interpretation()).isEqualTo("Exceso mandibular");
    }

    // --- Radiográfico, diagnóstico y firmas ---

    @Test
    void cephalometric_analyses_without_duplicates_in_fixed_order() {
        RadiographicAnalysis r = new RadiographicAnalysis(null,
            List.of(CephalometricAnalysis.WITS, CephalometricAnalysis.STEINER, CephalometricAnalysis.WITS), null, null, null, null);
        assertThat(RecordNormalizer.radiographic(r).cephalometricAnalyses())
            .containsExactly(CephalometricAnalysis.STEINER, CephalometricAnalysis.WITS);
    }

    @Test
    void list_items_are_trimmed_blank_ones_dropped_and_user_order_kept() {
        Diagnosis d = new Diagnosis(null, List.of(" Mordida profunda ", "  ", "Overjet aumentado"), null,
            null, null, null, null, null);
        assertThat(RecordNormalizer.diagnosis(d).problemList()).containsExactly("Mordida profunda", "Overjet aumentado");
        assertThat(RecordNormalizer.diagnosis(d).treatmentGoals()).isEmpty();
    }

    @Test
    void guardian_signs_for_minors_and_patient_otherwise() {
        Signatures s = new Signatures("Ana", "Rosa Mamani", "Madre", "Dr. Medina", null, "Dra. Torres");
        Signatures minor = RecordNormalizer.signatures(s, 13);
        assertThat(minor.patientSignatureName()).isNull();
        assertThat(minor.guardianName()).isEqualTo("Rosa Mamani");
        Signatures adult = RecordNormalizer.signatures(s, 18);
        assertThat(adult.patientSignatureName()).isEqualTo("Ana");
        assertThat(adult.guardianName()).isNull();
        assertThat(adult.guardianRelationship()).isNull();
        assertThat(RecordNormalizer.signatures(s, null).patientSignatureName()).isEqualTo("Ana");
    }
}

package com.odontorisas.service.records;

import com.odontorisas.common.PatientSex;
import com.odontorisas.service.records.content.Anamnesis;
import com.odontorisas.service.records.content.AngleRelation;
import com.odontorisas.service.records.content.AvailableSpace;
import com.odontorisas.service.records.content.Diagnosis;
import com.odontorisas.service.records.content.FacialAnalysis;
import com.odontorisas.service.records.content.FacialAnalysis.FacialPattern;
import com.odontorisas.service.records.content.FdiTeeth;
import com.odontorisas.service.records.content.FunctionalAnalysis;
import com.odontorisas.service.records.content.FunctionalAnalysis.Bruxism;
import com.odontorisas.service.records.content.FunctionalAnalysis.SuckingHabit;
import com.odontorisas.service.records.content.FunctionalAnalysis.TongueActivity;
import com.odontorisas.service.records.content.LowerArchWidths;
import com.odontorisas.service.records.content.LowerIncisors;
import com.odontorisas.service.records.content.Midline;
import com.odontorisas.service.records.content.ModelAnalysis;
import com.odontorisas.service.records.content.MoyersAnalysis;
import com.odontorisas.service.records.content.NanceAnalysis;
import com.odontorisas.service.records.content.OcclusalAnalysis;
import com.odontorisas.service.records.content.OcclusalAnalysis.SpeeCurve;
import com.odontorisas.service.records.content.OcclusalAnalysis.Transverse;
import com.odontorisas.service.records.content.OcclusalAnalysis.Vertical;
import com.odontorisas.service.records.content.RadiographicAnalysis;
import com.odontorisas.service.records.content.RecordContent;
import com.odontorisas.service.records.content.SideRelations;
import com.odontorisas.service.records.content.Signatures;
import com.odontorisas.service.records.content.TransversalAnalysis;
import com.odontorisas.service.records.content.UpperArchWidths;
import com.odontorisas.service.records.content.WalaToEv;
import com.odontorisas.service.records.content.YesNo;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

/**
 * Normaliza una historia antes de guardarla (design D4): recorta textos, convierte vacíos en
 * {@code null}, ordena y quita duplicados de las listas y <b>descarta los campos condicionados
 * cuya condición no se cumple</b> (D3). La regla vive solo aquí; el frontend solo oculta.
 * Sin estado ni dependencias: funciones puras.
 */
public final class RecordNormalizer {

    private RecordNormalizer() {
    }

    /** {@code ageYears} decide quién firma (apoderado si es menor de edad). */
    public static RecordData normalize(RecordData data, Integer ageYears) {
        String documentNumber = text(data.documentNumber());
        return new RecordData(
            text(data.treatingDentist()),
            text(data.patientName()),
            documentNumber == null ? null : data.documentType(),
            data.documentType() == null ? null : documentNumber,
            data.patientSex(),
            data.birthDate(),
            text(data.birthPlace()),
            text(data.address()),
            text(data.phone()),
            data.treatmentStartDate(),
            content(data.content(), data.patientSex(), ageYears));
    }

    /** Contenido con todas las secciones presentes y sus reglas aplicadas. */
    public static RecordContent content(RecordContent content, PatientSex sex, Integer ageYears) {
        RecordContent c = content != null ? content : RecordContent.empty();
        Anamnesis anamnesis = anamnesis(c.anamnesis() != null ? c.anamnesis() : Anamnesis.empty(), sex);
        return new RecordContent(
            RecordContent.CURRENT_SCHEMA_VERSION,
            anamnesis,
            facial(c.facial() != null ? c.facial() : FacialAnalysis.empty()),
            functional(c.functional() != null ? c.functional() : FunctionalAnalysis.empty(), anamnesis.suckingHabits()),
            occlusal(c.occlusal() != null ? c.occlusal() : OcclusalAnalysis.empty()),
            models(c.models() != null ? c.models() : ModelAnalysis.empty()),
            radiographic(c.radiographic() != null ? c.radiographic() : RadiographicAnalysis.empty()),
            diagnosis(c.diagnosis() != null ? c.diagnosis() : Diagnosis.empty()),
            signatures(c.signatures() != null ? c.signatures() : Signatures.empty(), ageYears));
    }

    static Anamnesis anamnesis(Anamnesis a, PatientSex sex) {
        return new Anamnesis(
            text(a.chiefComplaint()), text(a.personalPreferences()), a.cooperation(), a.oralHygiene(),
            a.suckingHabits(),
            sex == PatientSex.FEMALE ? a.menarche() : null,
            text(a.medicalHistory()), text(a.accidentsHistory()), text(a.familyStructure()),
            text(a.generalTreatmentNeeds()), text(a.heredity()));
    }

    static FacialAnalysis facial(FacialAnalysis f) {
        boolean patternII = f.facialPattern() == FacialPattern.PATTERN_II;
        boolean patternIII = f.facialPattern() == FacialPattern.PATTERN_III;
        return new FacialAnalysis(
            f.facialType(), f.convexity(),
            f.facialThirds(), text(f.facialThirdsNotes()),
            f.lipSeal(), f.lipAnteroposteriorRelation(),
            f.restSymmetry(), text(f.restSymmetryNotes()),
            f.openingSymmetry(), text(f.openingSymmetryNotes()),
            f.nasolabialAngle(), f.mentolabialSulcus(), f.zygomaticProjection(), f.chinNeckLine(), f.chinNeckAngle(),
            f.facialPattern(),
            patternII ? enums(f.patternIIFeatures()) : List.of(), patternII ? f.patternIIAfai() : null,
            patternIII ? enums(f.patternIIIFeatures()) : List.of(), patternIII ? f.patternIIIAfai() : null);
    }

    static FunctionalAnalysis functional(FunctionalAnalysis f, YesNo suckingHabitsInAnamnesis) {
        return new FunctionalAnalysis(
            f.breathing(), f.swallowing(), f.lipClosure(), f.tongueActivity(),
            f.tongueActivity() == TongueActivity.LATERAL_INTERPOSITION ? enums(f.tongueLateralSides()) : List.of(),
            f.upperLip(), f.lowerLip(), f.masseter(), f.mentalis(),
            suckingHabits(f.suckingHabitTypes(), suckingHabitsInAnamnesis),
            f.lingualFrenulum(), f.snoring(), f.bruxism(),
            f.bruxism() == Bruxism.WITH_WEAR ? teeth(f.bruxismTeeth(), false) : List.of());
    }

    /** "No" excluye al resto y es el valor por defecto; con "No" en la anamnesis queda fijo. */
    static List<SuckingHabit> suckingHabits(List<SuckingHabit> habits, YesNo inAnamnesis) {
        List<SuckingHabit> real = enums(habits).stream().filter(h -> h != SuckingHabit.NONE).toList();
        if (inAnamnesis == YesNo.NO || real.isEmpty()) {
            return List.of(SuckingHabit.NONE);
        }
        return real;
    }

    static OcclusalAnalysis occlusal(OcclusalAnalysis o) {
        boolean apNormal = Boolean.TRUE.equals(o.anteroposteriorNormal());
        boolean mi = Boolean.TRUE.equals(o.miDiffersFromRc());
        boolean mih = Boolean.TRUE.equals(o.mihDiffersFromRc());
        return new OcclusalAnalysis(
            o.transverse(),
            o.transverse() == Transverse.UNILATERAL_POSTERIOR_CROSSBITE ? o.crossbiteSide() : null,
            o.crossbiteType(),
            o.vertical(),
            o.vertical() == Vertical.DEEP_BITE ? o.deepBitePercent() : null,
            o.vertical() == Vertical.OPEN_BITE ? o.openBiteMm() : null,
            o.speeCurve(),
            o.speeCurve() == SpeeCurve.ALTERED ? text(o.speeCurveDetail()) : null,
            apNormal ? Boolean.TRUE : null,
            apNormal ? null : o.overjetMm(),
            apNormal ? List.of() : teeth(o.anteriorCrossbiteTeeth(), true),
            midline(o.midlineUpper()), midline(o.midlineLower()),
            relations(o.canineRelation()), relations(o.molarRelation()),
            mi ? Boolean.TRUE : null, mi ? relations(o.canineRelationMi()) : null,
            mih ? Boolean.TRUE : null, mih ? relations(o.canineRelationMih()) : null,
            text(o.dentalAnomalies()), text(o.tmjCondition()),
            o.familyMalocclusion(),
            o.familyMalocclusion() == YesNo.YES ? text(o.familyMalocclusionWho()) : null);
    }

    static Midline midline(Midline m) {
        if (m == null || m.position() == null) {
            return null;
        }
        return new Midline(m.position(), m.isDeviated() ? m.deviationMm() : null);
    }

    static SideRelations relations(SideRelations r) {
        if (r == null) {
            return null;
        }
        AngleRelation right = relation(r.right());
        AngleRelation left = relation(r.left());
        return right == null && left == null ? null : new SideRelations(right, left);
    }

    static AngleRelation relation(AngleRelation r) {
        if (r == null || (r.angleClass() == null && text(r.detail()) == null)) {
            return null;
        }
        return new AngleRelation(r.angleClass(), text(r.detail()));
    }

    static ModelAnalysis models(ModelAnalysis m) {
        TransversalAnalysis t = m.transversal() != null ? m.transversal() : TransversalAnalysis.empty();
        MoyersAnalysis y = m.moyers() != null ? m.moyers() : MoyersAnalysis.empty();
        NanceAnalysis n = m.nance() != null ? m.nance() : NanceAnalysis.empty();
        return new ModelAnalysis(
            new TransversalAnalysis(
                t.intercanineUpper(), t.intercanineLower(), t.intermolarUpper(), t.intermolarLower(),
                t.walaWidth(), t.xPcWidth(), t.xPrimePcWidth(), t.xIdealWidth(),
                t.walaToEv() != null ? t.walaToEv() : WalaToEv.empty(),
                text(t.interpretation())),
            new MoyersAnalysis(
                y.analysisDate(),
                y.lowerIncisors() != null ? y.lowerIncisors() : LowerIncisors.empty(),
                y.availableSpace() != null ? y.availableSpace() : AvailableSpace.empty(),
                text(y.crowdingPositive()), text(y.crowdingNeutral()), text(y.crowdingNegative()),
                text(y.interpretation())),
            new NanceAnalysis(
                n.analysisDate(), n.availableUpper(), n.availableLower(),
                n.upperWidths() != null ? n.upperWidths() : UpperArchWidths.empty(),
                n.lowerWidths() != null ? n.lowerWidths() : LowerArchWidths.empty(),
                text(n.conclusionUpper()), text(n.conclusionLower()), text(n.interpretation())));
    }

    static RadiographicAnalysis radiographic(RadiographicAnalysis r) {
        return new RadiographicAnalysis(text(r.panoramicDiagnosis()), enums(r.cephalometricAnalyses()),
            text(r.apicalBases()), text(r.growthTendency()), text(r.dentoalveolar()), text(r.others()));
    }

    static Diagnosis diagnosis(Diagnosis d) {
        return new Diagnosis(text(d.generalDiagnosis()), items(d.problemList()), items(d.treatmentGoals()),
            text(d.treatmentPlan1()), text(d.treatmentPlan2()), text(d.treatmentSequence()),
            text(d.nextStages()), text(d.finalTreatmentPlan()));
    }

    /** Firma el apoderado si el paciente es menor; si no (o sin edad), el paciente. */
    static Signatures signatures(Signatures s, Integer ageYears) {
        boolean minor = RecordAgeCalculator.isMinor(ageYears);
        return new Signatures(
            minor ? null : text(s.patientSignatureName()),
            minor ? text(s.guardianName()) : null,
            minor ? text(s.guardianRelationship()) : null,
            text(s.supervisor1Name()), text(s.supervisor2Name()), text(s.treatingSignatureName()));
    }

    /** Recorta; vacío → {@code null}. */
    static String text(String value) {
        if (value == null) {
            return null;
        }
        String stripped = value.strip();
        return stripped.isEmpty() ? null : stripped;
    }

    /** Sin nulos ni duplicados, en el orden de declaración del enum (orden estable al imprimir). */
    static <E extends Enum<E>> List<E> enums(Collection<E> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream().filter(Objects::nonNull).distinct().sorted(Comparator.comparingInt(Enum::ordinal)).toList();
    }

    /** Piezas FDI válidas, sin duplicados y ordenadas ("13, 26, 55"). */
    static List<Integer> teeth(Collection<Integer> values, boolean anteriorOnly) {
        if (values == null) {
            return List.of();
        }
        return values.stream().filter(Objects::nonNull).filter(t -> FdiTeeth.isValid(t, anteriorOnly))
            .distinct().sorted().toList();
    }

    /** Ítems recortados, sin vacíos, conservando el orden del usuario. */
    static List<String> items(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream().map(RecordNormalizer::text).filter(Objects::nonNull).toList();
    }
}

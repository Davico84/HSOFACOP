package com.odontorisas.contract;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.JsonNodeFactory;
import tools.jackson.databind.node.ObjectNode;

/**
 * Utilidades del guardiÃ¡n del contrato OpenAPI (design D2â€“D3): normalizaciÃ³n
 * semÃ¡ntica, diff por rutas JSON y serializaciÃ³n idÃ©ntica a
 * {@code JSON.stringify(doc, null, 2) + "\n"}.
 */
final class ContractJson {

    static final int MAX_DIFFS = 20;

    /** Arrays con semÃ¡ntica de conjunto: se ordenan antes de comparar. */
    private static final Set<String> SET_ARRAYS = Set.of("required", "tags");

    private static final JsonMapper MAPPER = JsonMapper.builder().build();
    private static final JsonNodeFactory NODES = JsonNodeFactory.instance;

    private ContractJson() {
    }

    static JsonNode parse(String json) {
        return MAPPER.readTree(json);
    }

    // ---------------------------------------------------------------- normalize

    /** Sin {@code servers}, nÃºmeros con semÃ¡ntica JS y {@code required}/{@code tags} ordenados. */
    static JsonNode normalize(JsonNode doc) {
        JsonNode copy = normalizeNode(doc, null);
        if (copy instanceof ObjectNode root) {
            root.remove("servers");
        }
        return copy;
    }

    private static JsonNode normalizeNode(JsonNode node, String name) {
        if (node.isObject()) {
            ObjectNode out = NODES.objectNode();
            for (Map.Entry<String, JsonNode> e : node.properties()) {
                out.set(e.getKey(), normalizeNode(e.getValue(), e.getKey()));
            }
            return out;
        }
        if (node.isArray()) {
            List<JsonNode> items = new ArrayList<>();
            for (JsonNode item : node.values()) {
                items.add(normalizeNode(item, null));
            }
            if (name != null && SET_ARRAYS.contains(name)) {
                items.sort(Comparator.comparing(JsonNode::toString));
            }
            ArrayNode out = NODES.arrayNode();
            items.forEach(out::add);
            return out;
        }
        if (node.isNumber()) {
            return NODES.numberNode(jsNumber(node.doubleValue()));
        }
        return node;
    }

    /** Valor numÃ©rico tal como lo ve JS: double, {@code -0} = {@code 0}, sin ceros de escala. */
    private static BigDecimal jsNumber(double d) {
        return BigDecimal.valueOf(d).stripTrailingZeros();
    }

    // --------------------------------------------------------------------- diff

    /** Rutas JSON donde difieren dos documentos ya normalizados (primeras {@value #MAX_DIFFS}). */
    static List<String> diff(JsonNode expected, JsonNode actual) {
        List<String> out = new ArrayList<>();
        diff(expected, actual, "", out);
        return out;
    }

    private static void diff(JsonNode a, JsonNode b, String path, List<String> out) {
        if (out.size() >= MAX_DIFFS) {
            return;
        }
        if (a.isObject() && b.isObject()) {
            Set<String> keys = new LinkedHashSet<>(a.propertyNames());
            keys.addAll(b.propertyNames());
            for (String key : keys) {
                String child = path.isEmpty() ? key : path + "." + key;
                JsonNode av = a.get(key);
                JsonNode bv = b.get(key);
                if (av == null || bv == null) {
                    add(out, child);
                } else {
                    diff(av, bv, child, out);
                }
            }
            return;
        }
        if (a.isArray() && b.isArray()) {
            int common = Math.min(a.size(), b.size());
            for (int i = 0; i < common; i++) {
                diff(a.get(i), b.get(i), path + "[" + i + "]", out);
            }
            for (int i = common; i < Math.max(a.size(), b.size()); i++) {
                add(out, path + "[" + i + "]");
            }
            return;
        }
        if (a.isNumber() && b.isNumber()) {
            if (a.decimalValue().compareTo(b.decimalValue()) != 0) {
                add(out, path);
            }
            return;
        }
        if (!a.equals(b)) {
            add(out, path);
        }
    }

    private static void add(List<String> out, String path) {
        if (out.size() < MAX_DIFFS) {
            out.add(path.isEmpty() ? "$" : path);
        }
    }

    // ---------------------------------------------------------------- stringify

    /** Serializa igual que {@code JSON.stringify(doc, null, 2) + "\n"}. */
    static String stringify(JsonNode doc) {
        StringBuilder sb = new StringBuilder();
        write(doc, 0, sb);
        return sb.append('\n').toString();
    }

    private static void write(JsonNode node, int depth, StringBuilder sb) {
        if (node.isObject()) {
            if (node.isEmpty()) {
                sb.append("{}");
                return;
            }
            sb.append("{\n");
            boolean first = true;
            for (Map.Entry<String, JsonNode> e : node.properties()) {
                if (!first) {
                    sb.append(",\n");
                }
                first = false;
                indent(depth + 1, sb);
                writeString(e.getKey(), sb);
                sb.append(": ");
                write(e.getValue(), depth + 1, sb);
            }
            sb.append('\n');
            indent(depth, sb);
            sb.append('}');
        } else if (node.isArray()) {
            if (node.isEmpty()) {
                sb.append("[]");
                return;
            }
            sb.append("[\n");
            for (int i = 0; i < node.size(); i++) {
                if (i > 0) {
                    sb.append(",\n");
                }
                indent(depth + 1, sb);
                write(node.get(i), depth + 1, sb);
            }
            sb.append('\n');
            indent(depth, sb);
            sb.append(']');
        } else if (node.isString()) {
            writeString(node.stringValue(), sb);
        } else if (node.isNumber()) {
            sb.append(jsNumberToString(node.doubleValue()));
        } else if (node.isBoolean()) {
            sb.append(node.booleanValue());
        } else {
            sb.append("null");
        }
    }

    private static void indent(int depth, StringBuilder sb) {
        sb.append("  ".repeat(depth));
    }

    private static void writeString(String s, StringBuilder sb) {
        sb.append('"');
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        unicodeEscape(c, sb);
                    } else if (Character.isHighSurrogate(c)) {
                        if (i + 1 < s.length() && Character.isLowSurrogate(s.charAt(i + 1))) {
                            sb.append(c).append(s.charAt(++i));
                        } else {
                            unicodeEscape(c, sb);
                        }
                    } else if (Character.isLowSurrogate(c)) {
                        unicodeEscape(c, sb);
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        sb.append('"');
    }

    private static void unicodeEscape(char c, StringBuilder sb) {
        sb.append(String.format("\\u%04x", (int) c));
    }

    /** {@code Number.prototype.toString()} de JS (ECMA-262 Number::toString, radix 10). */
    static String jsNumberToString(double d) {
        if (d == 0) {
            return "0";
        }
        String sign = d < 0 ? "-" : "";
        // Double.toString da la representaciÃ³n decimal mÃ¡s corta (JDK 19+), igual que JS.
        BigDecimal bd = new BigDecimal(Double.toString(Math.abs(d))).stripTrailingZeros();
        String s = bd.unscaledValue().toString();
        int k = s.length();
        int n = k - bd.scale();
        String body;
        if (k <= n && n <= 21) {
            body = s + "0".repeat(n - k);
        } else if (0 < n && n <= 21) {
            body = s.substring(0, n) + "." + s.substring(n);
        } else if (-6 < n && n <= 0) {
            body = "0." + "0".repeat(-n) + s;
        } else {
            int e = n - 1;
            String exp = "e" + (e < 0 ? "-" : "+") + Math.abs(e);
            body = k == 1 ? s + exp : s.charAt(0) + "." + s.substring(1) + exp;
        }
        return sign + body;
    }
}

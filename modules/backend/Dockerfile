# Imagen del backend para el despliegue (Render, plan gratuito: 512 MB, 0,1 CPU). Ver docs/deployment.md.
# Las pruebas no se repiten aquí: se despliega `main`, que solo recibe merges con `mvn verify` en verde.

# --- 1. Build: JDK 25 + Maven wrapper ---
FROM eclipse-temurin:25-jdk AS build
WORKDIR /build
# Dependencias primero: capa cacheable mientras no cambie el pom.
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -q -B dependency:go-offline
COPY src src
# Solo el jar ejecutable de Spring Boot (no el .jar.original), extraído como recomienda Spring Boot
# para el AOT cache.
RUN ./mvnw -q -B -DskipTests package \
    && java -Djarmode=tools -jar target/backend-*.jar extract --destination /build/extracted \
    && mv /build/extracted/backend-*.jar /build/extracted/app.jar

# --- 2. Runtime: JRE 25, solo la app extraída + AOT cache, sin privilegios ---
FROM eclipse-temurin:25-jre
RUN groupadd --system app && useradd --system --gid app --no-create-home app
COPY --from=build /build/extracted /app
WORKDIR /app

# Opciones de la JVM, iguales en el entrenamiento y en la ejecución (el AOT cache lo exige):
# - G1 explícito: con < 2 CPU la JVM elegiría SerialGC y no podría cargar el heap archivado.
# - Solo C1 (TieredStopAtLevel=1): con 0,1 CPU el compilador C2 retrasa el arranque.
# Medido con 512 MB y 0,1 CPU: ~294 s sin esto, ~54 s con esto (docs/deployment.md).
ENV JVM_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=70 -Xss512k -XX:TieredStopAtLevel=1"

# AOT cache de Java 25 (JEP 483/514/515): una corrida de entrenamiento que arranca el contexto y sale
# tras el refresh, sin base de datos (Flyway apagado, Hibernate sin leer metadatos de la BD).
# Debe crearse con esta misma imagen de JRE. Los valores son solo de entrenamiento, no secretos.
RUN java $JVM_OPTS -Xmx358m -XX:AOTCacheOutput=/app/app.aot \
      -Dspring.context.exit=onRefresh \
      -Dspring.flyway.enabled=false \
      -Dspring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access=false \
      -Dspring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect \
      -Dspring.datasource.url=jdbc:postgresql://localhost:5432/training \
      -Dspring.datasource.username=training -Dspring.datasource.password=training \
      -Dapp.security.jwt.secret=training-only-not-a-secret-0123456789abcdef \
      -jar app.jar \
    && chown -R app:app /app

USER app
ENV JAVA_TOOL_OPTIONS="$JVM_OPTS -XX:AOTCache=/app/app.aot -XX:+ExitOnOutOfMemoryError"
# Render inyecta PORT; en local, 8080 (server.port: ${PORT:8080}).
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

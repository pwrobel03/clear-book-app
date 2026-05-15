# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Build
# Uses the Maven wrapper bundled in the repo so no external Maven is needed.
# ─────────────────────────────────────────────────────────────────────────────
FROM eclipse-temurin:25-jdk-noble AS builder
WORKDIR /app

# Copy wrapper first — lets Docker cache the Maven download layer
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B -q

# Copy source and build (tests are skipped; CI should run them separately)
COPY src ./src
RUN ./mvnw package -DskipTests -B -q

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Runtime
# Minimal image: only the JRE + the fat JAR produced above.
# ─────────────────────────────────────────────────────────────────────────────
FROM eclipse-temurin:25-jre-noble AS runner
WORKDIR /app

# Create a non-root user for security
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser
USER appuser

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

# JVM flags:
#   -XX:+UseContainerSupport   — respects Docker CPU/RAM limits
#   -XX:MaxRAMPercentage=75    — use up to 75% of container memory for heap
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]

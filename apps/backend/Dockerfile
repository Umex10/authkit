# =============================================================================
# AuthKit backend — multi-stage image
#
# Stage 1 builds the fat jar with the Maven wrapper (no local Maven needed).
# Stage 2 ships only a JRE + the jar, keeping the runtime image small.
# Build context is apps/backend (see docker-compose.yml).
# =============================================================================

# ---- Build stage ------------------------------------------------------------
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copy only what is needed to resolve dependencies first, so this layer is
# cached and re-downloaded only when pom.xml changes.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline

# Now copy the sources and build (tests run in CI, not in the image build).
COPY src ./src
RUN ./mvnw -B -q clean package -DskipTests

# ---- Runtime stage ----------------------------------------------------------
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# Run as a non-root user.
RUN useradd --system --uid 1001 authkit
USER authkit

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

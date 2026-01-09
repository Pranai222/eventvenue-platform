# Build stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render uses PORT env variable (default 10000)
ENV PORT=10000
EXPOSE ${PORT}

# Run the application with dynamic port
ENTRYPOINT ["sh", "-c", "java -jar -Dserver.port=${PORT} app.jar"]

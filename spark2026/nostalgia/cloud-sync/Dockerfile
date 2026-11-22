FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /src

ARG MAVEN_MIRROR=
RUN set -eux; \
    if [ -n "${MAVEN_MIRROR}" ]; then \
      mkdir -p /root/.m2; \
      printf '%s' "<settings><mirrors><mirror><id>mirror</id><mirrorOf>central</mirrorOf><url>${MAVEN_MIRROR}</url></mirror></mirrors></settings>" > /root/.m2/settings.xml; \
    fi

COPY pom.xml ./
COPY src ./src
RUN mvn -B -ntp -DskipTests package

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN adduser -D -u 1000 cloud
COPY --from=build /src/target/cloud-sync-*.jar /app/app.jar
USER cloud
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70", "-jar", "/app/app.jar"]

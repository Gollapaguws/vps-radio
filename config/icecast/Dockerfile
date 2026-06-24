# config/icecast/Dockerfile
# Custom Icecast2 image with envsubst for ${VAR} substitution in icecast.xml
FROM debian:bookworm-slim

RUN apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends \
      icecast2 \
      gettext-base \
      curl \
    && rm -rf /var/lib/apt/lists/*

# Template is copied into the image; docker-compose mounts override at runtime
COPY icecast.xml /etc/icecast2/icecast.xml.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["icecast2", "-c", "/etc/icecast2/icecast.xml"]

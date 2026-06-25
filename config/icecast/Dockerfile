# config/icecast/Dockerfile
# Custom Icecast2 image with envsubst for ${VAR} substitution in icecast.xml
FROM debian:bookworm-slim

RUN apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends \
      icecast2 \
      gettext-base \
      curl \
      gosu \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system icecast2grp \
    && adduser --system --ingroup icecast2grp --no-create-home icecastrun \
    && mkdir -p /var/log/icecast2 /var/run/icecast2 /etc/icecast2 \
    && chown -R icecastrun:icecast2grp /var/log/icecast2 /var/run/icecast2 /etc/icecast2

# Template is copied into the image; docker-compose mounts override at runtime
COPY icecast.xml /etc/icecast2/icecast.xml.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
    && chown icecastrun:icecast2grp /etc/icecast2/icecast.xml.template

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["icecast2", "-c", "/etc/icecast2/icecast.xml"]

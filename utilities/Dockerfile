FROM ubuntu:20.04
RUN apt-get update && \
    apt-get install -yq tzdata && \
    ln -fs /usr/share/zoneinfo/America/Chicago /etc/localtime && \
    dpkg-reconfigure -f noninteractive tzdata
RUN apt-get install -y aptitude vim magic-wormhole
RUN apt-get install -y curl ca-certificates gnupg
RUN curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor | tee /etc/apt/trusted.gpg.d/apt.postgresql.org.gpg >/dev/null
RUN echo "deb http://apt.postgresql.org/pub/repos/apt focal-pgdg main" > /etc/apt/sources.list.d/pgdg.list
RUN apt-get update
RUN apt-get install -y postgresql-client-13
RUN apt-get install -y awscli
RUN apt-get install -y libdbi-perl libdbd-pg-perl libtext-csv-perl libexcel-writer-xlsx-perl
WORKDIR /root/utilities
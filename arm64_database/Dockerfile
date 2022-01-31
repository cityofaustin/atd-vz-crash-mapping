FROM frankinaustin/postgis:13-3.2
RUN apt-get update && \
    apt-get install -yq tzdata && \
    ln -fs /usr/share/zoneinfo/America/Chicago /etc/localtime && \
    dpkg-reconfigure -f noninteractive tzdata
RUN apt-get install -y aptitude postgresql-plperl-13 vim magic-wormhole
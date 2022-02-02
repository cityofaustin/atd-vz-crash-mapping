FROM ubuntu:20.04
COPY ./vimrc /root/.vimrc
RUN apt-get update
RUN apt-get -y upgrade
RUN apt-get install -y tzdata
RUN ln -fs /usr/share/zoneinfo/America/Chicago /etc/localtime
RUN dpkg-reconfigure --frontend noninteractive tzdata
RUN apt-get install -y aptitude vim curl
RUN curl -sL https://deb.nodesource.com/setup_15.x | bash -
RUN apt-get update
RUN apt-get install -y nodejs
RUN apt-get install -y gcc g++ make
RUN curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update
RUN apt-get install -y yarn
RUN yarn global add parcel-bundler
RUN apt-get install -y apache2 libdbi-perl libdbd-pg-perl libjson-perl
#COPY ./app /root/html/
#COPY ./diagrams /usr/lib/cgi-bin/
#COPY ./diagram_icons /var/www/html/diagram_icons
#COPY ./white_tile.jpg /var/www/html/white_tile.jpg
#COPY ./000-default.conf /etc/apache2/sites-available/000-default.conf
RUN a2enmod cgid
RUN a2enmod headers

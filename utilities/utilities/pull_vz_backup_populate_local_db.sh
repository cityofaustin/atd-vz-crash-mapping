#!/bin/sh

/root/utilities/download_latest_vz_backup.sh

echo 'drop database atd_vz_data' | psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME $POSTGRES_DB
echo 'create database atd_vz_data' | psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME $POSTGRES_DB
echo 'create extension postgis' | psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME $POSTGRES_DB
echo 'create extension plperl' | psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME $POSTGRES_DB

zcat /root/tmp/atd_vz_data-full.sql.gz | /root/utilities/skip_changelog_out_of_db_archive.pl | psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME $POSTGRES_DB

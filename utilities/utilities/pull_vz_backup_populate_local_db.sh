#!/bin/sh

/root/utilities/download_latest_vz_backup.sh

DATE=$(date +"%Y-%m-%d-%H-%M")

echo "Dumping out diagram data tables from DB."
pg_dump --no-owner -h $POSTGRES_HOSTNAME -U $POSTGRES_USER -t diagram_aoi -t diagram_crashes -t diagram_icon_crash_map -t diagram_intersections -t diagram_sessions $POSTGRES_DB > /root/diagram_data/diagram_$DATE.sql

echo "About to terminate connections to this database so it can be DROPed. An error-like message is expected."
echo "select pg_terminate_backend(pid) as process_id from pg_stat_activity where pid != pg_backend_pid()" | psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME $POSTGRES_DB
echo 'drop database atd_vz_data' | psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME postgres
echo 'create database atd_vz_data' | psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME postgres
echo 'create extension postgis' | psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME $POSTGRES_DB
echo 'create extension plperl' | psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME $POSTGRES_DB

zcat /root/tmp/atd_vz_data-full.sql.gz | /root/utilities/skip_changelog_out_of_db_archive.pl | psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME $POSTGRES_DB

cat /root/utilities/db_schema/functions.sql | psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME $POSTGRES_DB 
cat /root/diagram_data/diagram_$DATE.sql | psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME $POSTGRES_DB 
cat /root/utilities/db_schema/view_materialized_views.sql | psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME $POSTGRES_DB 
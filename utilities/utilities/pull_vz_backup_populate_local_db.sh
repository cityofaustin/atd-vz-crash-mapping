#!/bin/sh

/root/utilities/download_latest_vz_backup.sh

DATE=$(date +"%Y-%m-%d-%H-%M")

echo "Dumping out diagram data tables from DB."
pg_dump --no-owner -h $POSTGRES_HOSTNAME -U $POSTGRES_USER -t diagram_aoi -t diagram_crashes -t diagram_icon_crash_map -t diagram_intersections -t diagram_sessions $POSTGRES_DB > /root/diagram_data/diagram_$DATE.sql


zcat /root/tmp/atd_vz_data-full.sql.gz | /root/utilities/skip_changelog_out_of_db_archive.pl | psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME $POSTGRES_DB

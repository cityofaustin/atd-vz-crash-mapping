#!/bin/bash

aws s3 cp s3://atd-vision-zero-database/backups/atd_vz_data_production/public/`date  --date="yesterday" +"%Y-%m-%d"`/atd_vz_data-full.sql.gz /root/tmp/atd_vz_data-full.sql.gz


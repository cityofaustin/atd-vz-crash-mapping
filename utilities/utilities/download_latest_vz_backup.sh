#!/bin/bash

FILE_LOCATION="/root/tmp/atd_vz_data-full.sql.gz";
declare -i TOO_OLD_AGE=24*60*60; # one day

if [ -f "$FILE_LOCATION" ]
  then
    FILE_AGE=$(echo $(($(date +%s) - $(date +%s -r "/root/tmp/atd_vz_data-full.sql.gz"))));
    if [ $FILE_AGE -ge $TOO_OLD_AGE ]
      then 
        echo "File is present but old.";
        aws s3 cp s3://atd-vision-zero-database/backups/atd_vz_data_production/public/`date  --date="yesterday" +"%Y-%m-%d"`/atd_vz_data-full.sql.gz $FILE_LOCATION
      else
        echo "File is present and recent.";
      fi
  else
    echo "File is missing. Downloading from S3.";
    aws s3 cp s3://atd-vision-zero-database/backups/atd_vz_data_production/public/`date  --date="yesterday" +"%Y-%m-%d"`/atd_vz_data-full.sql.gz $FILE_LOCATION
  fi

# atd-vz-crash-mapping


## Useful commands
* Build images for X86: `docker-compose -f ./docker-compose.yml -f docker-compose.x86-64.yml build`
* Start containers: `docker-compose -f ./docker-compose.yml -f docker-compose.x86-64.yml up -d`
* Stop containers: `docker-compose -f ./docker-compose.yml -f docker-compose.x86-64.yml stop`
* Open shell on utility container: `docker exec -it crash_mapping_utilities bash`
* Open `psql` on database in `atd_vz_data` database: `docker exec -it crash_mapping_database psql -U crash_mapping atd_vz_data`
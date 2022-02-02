# atd-vz-crash-mapping


## Useful commands
### Substitute architecture specific YAML file as needed
* Build images for X86: `docker-compose -f ./docker-compose.yml -f docker-compose.x86-64.yml build`
* Start containers: `docker-compose -f ./docker-compose.yml -f docker-compose.x86-64.yml up -d`
* Stop containers: `docker-compose -f ./docker-compose.yml -f docker-compose.x86-64.yml stop`
* Open shell on utility container: `docker exec -it crash_mapping_utilities bash`
* Open `psql` on database in `atd_vz_data` database: `docker exec -it crash_mapping_database psql -U crash_mapping atd_vz_data`
* On utility container, open `psql`: `psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME $POSTGRES_DB`

## Considerations
* The VZDB data can be downloaded fresh anytime, but this docker stack will contain the actual diagramming work and data. Considerations for backups?
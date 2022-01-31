# atd-vz-crash-mapping


## Useful commands
Build images for X86: `docker-compose -f ./docker-compose.yml -f docker-compose.x86-64.yml build`
Start containers: `docker-compose -f ./docker-compose.yml -f docker-compose.arm64.yml up -d`
Open shell on utility container: `docker exec -it crash_mapping_utilities bash`
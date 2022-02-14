start:
	docker-compose -f ./docker-compose.yml -f docker-compose.arm64.yml start
build:
	docker-compose -f ./docker-compose.yml -f docker-compose.arm64.yml build --no-cache
stop:
	docker-compose -f ./docker-compose.yml -f docker-compose.arm64.yml stop
  

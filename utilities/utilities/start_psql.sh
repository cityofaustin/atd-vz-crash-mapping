#!/bin/sh

psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME $POSTGRES_DB

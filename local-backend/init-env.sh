#!/bin/sh
set -eu
cd "$(dirname "$0")"
if [ -e .env ]; then
  echo 'Existing local environment preserved.'
  exit 0
fi
umask 077
# noclobber prevents simultaneous initializers from replacing the application key.
set -C
{
  printf 'APP_KEY=base64:%s\n' "$(openssl rand -base64 32)"
  printf 'DB_PASSWORD=%s\n' "$(openssl rand -hex 24)"
  printf 'DB_ROOT_PASSWORD=%s\n' "$(openssl rand -hex 24)"
  printf 'IN_PASSWORD=%s\n' "$(openssl rand -hex 24)"
  sed '/^APP_KEY=/d; /^DB_PASSWORD=/d; /^DB_ROOT_PASSWORD=/d; /^IN_PASSWORD=/d' env.example
} > .env
chmod 600 .env
echo 'Created private local environment.'

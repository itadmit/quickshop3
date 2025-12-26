#!/bin/bash

# טוען את nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# עובר לתיקיית הפרויקט
cd "$(dirname "$0")"

# מריץ את הפרויקט
npm run dev




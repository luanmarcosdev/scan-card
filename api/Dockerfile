FROM node:20-alpine

WORKDIR /app

# Copia apenas arquivos de dependência
COPY package*.json ./

# Intala as dependencias
RUN npm install

# Copia o resto do projeto (arquivos que não foram ignorados pelo .dockerignore)
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
# nextSteps.md

Criar migrations para cards primeiro e depois para expense_categories após migrations fazer o CRUD para essas tabelas seguindo o padrão do projeto com repository, dto e etc e após finalizar com os testes

# cards

id UUID
user_id FK user (1 user: N cards)
last_numbers VARCHAR(4)
name VARCHAR(50) NULL DEFAULT NULL
created_at DATETIME NOT NULL
updated_at DATETIME NULL DEFAULT NULL
deleted_at DATETIME NULL DEFAULT NULL

Regra: só é possivel deletar cartão que nao está em uso

# expense_categories

id UUID
user_id FK user (1 user: N expense_categories)
category VARCHAR(50) NOT NULL
description VARCHAR(50) NULL DEFAULT NULL
created_at DATETIME NOT NULL
updated_at DATETIME NULL DEFAULT NULL
deleted_at DATETIME NULL DEFAULT NULL

Regras: 
- só é possivel deletar categoria que nao está em uso. 
- ao criar um usuário eu preciso q seja inserido categorias padrões para ele ['Alimentação','Transporte','Saúde','Lazer','Educação','Moradia','Outros']
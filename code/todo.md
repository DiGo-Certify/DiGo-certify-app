# TODO

- Fazer a separação dos ecrãs para os 3 diferentes tipos de utilizadores, de forma a que cada um tenha acesso apenas ao que lhe é permitido.

## User pede claims (pede um novo certificado)

- Modal:

  - Formulário:

    - Nome
    - Email
    - Codigo do pais
    - Codigo da instituição
    - Numero de aluno

  - Botão de submeter:
    - Enviar um mail para a instituição com os dados do formulário

## Emite certificados

- Emitir claims para a entidade que pediu.

  - Uri onde está o documento ou a hash do uri do IPFS
  - Codigo do Pais

- Formulário:

  - Numero de aluno
  - Numero de registo
  - Codigo do curso da DGES
  - Codigo da instituição
  - Uri onde está o documento ou a hash do uri do IPFS ou faz upload do documento.

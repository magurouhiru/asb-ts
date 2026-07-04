# 公式のDev Containerイメージをベースに使用
# https://github.com/devcontainers/images/tree/main/src/base-debian
FROM mcr.microsoft.com/devcontainers/base:bookworm

# 定数の定義
ARG USERNAME=vscode \
    WORKSPACE=/home/${USERNAME}/app

RUN apt-get update && \
    apt-get upgrade -y

# rootだとなんとなく嫌なので、nodeユーザーに切り替える
USER ${USERNAME}
WORKDIR /home/${USERNAME}

# mount先のnode_modules,.pnpm-storeディレクトリの作成
RUN mkdir -p ${WORKSPACE}/node_modules \
    mkdir -p ${WORKSPACE}/.pnpm-store

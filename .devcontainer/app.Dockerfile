# 定数の定義
ARG NODE_VERSION=24

# 公式のDev Containerイメージをベースに使用
# https://github.com/devcontainers/images/tree/main/src/javascript-node
FROM mcr.microsoft.com/devcontainers/javascript-node:${NODE_VERSION}-trixie

# 定数の定義
ARG USERNAME=node \
    WORKSPACE=/home/${USERNAME}/app

RUN apt-get update && \
    apt-get upgrade -y

# rootだとなんとなく嫌なので、nodeユーザーに切り替える
USER ${USERNAME}
WORKDIR /home/${USERNAME}

# mount先のnode_modulesディレクトリの作成
RUN mkdir -p ${WORKSPACE}/node_modules

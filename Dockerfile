FROM centos:centos6
MAINTAINER hanxi <hanxi.info@gmail.com>

RUN yum -y install openssh-server epel-release && \
    yum -y install nodejs npm && \
    yum -y install pwgen && \
    rm -f /etc/ssh/ssh_host_dsa_key /etc/ssh/ssh_host_rsa_key && \
    ssh-keygen -q -N "" -t dsa -f /etc/ssh/ssh_host_dsa_key && \
    ssh-keygen -q -N "" -t rsa -f /etc/ssh/ssh_host_rsa_key && \
    sed -i "s/#UsePrivilegeSeparation.*/UsePrivilegeSeparation no/g" /etc/ssh/sshd_config && \
    sed -i "s/UsePAM.*/UsePAM no/g" /etc/ssh/sshd_config

ADD set_root_pw.sh /set_root_pw.sh
ADD run.sh /run.sh
RUN chmod +x /*.sh
ADD . /src

WORKDIR /src
RUN npm install

ENV AUTHORIZED_KEYS **None**
ENV WSPORT 8080
ENV HTTPPORT 80

EXPOSE 22
EXPOSE 80
EXPOSE 8080

CMD ["/run.sh"]

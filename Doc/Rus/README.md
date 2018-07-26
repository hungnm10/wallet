﻿# TERA Smart money


Внимание:
* После установки, указанной ниже, введите в браузере адрес: 127.0.0.1
* Вам нужно иметь статический (публичный) IP-адрес и открытый порт.
* Не забудьте установить пароль для ограничения доступа по http (нажмите кнопку HTTP ACCESS на вашем кошельке). Также мы рекомендуем сменить порт 80 на другой и не хранить приватные ключи на удаленных серверах.
* Рекомендуем поставить дополнительный пароль на приватный ключ (кнопка "Set password")  - в этом случае приватный ключ будет храниться в файле кошелька в зашифрованном виде.



## Установка на Windows по шагам:

1. Скачайте и установите Nodejs https://nodejs.org  (рекомендуется версия v8.11)
2. Скачайте и установите git https://desktop.github.com/
3. Далее выполните команды (для этого запустите программу cmd или PowerShell):
```
cd ..\..\..\
git clone https://github.com/terafoundation/wallet.git
cd wallet/Source
npm install
run-node.bat

```
Если вы хотите запускать кошелек в качестве фонового процесса, то вместо последней команды (run-node.bat) выполните следующие:
```
npm install pm2 -g
pm2 start run-node.js
```

### Открытие портов:
```
netsh advfirewall firewall add rule name="Open 30000 port" protocol=TCP localport=30000 action=allow dir=IN
```






## Установка на Linux 

Просто введите подряд в ssh-терминал команды указанные ниже (в зависимости от версии дистрибутива)


### Дистрибутив CentOS 7:

```
sudo yum install -y git
curl --silent --location https://rpm.nodesource.com/setup_8.x | sudo bash -
sudo yum  install -y nodejs
sudo npm install pm2 -g
sudo git clone https://github.com/terafoundation/wallet.git
cd wallet/Source
sudo npm install
sudo pm2 start run-node.js
```

### открытие всех портов:
```
systemctl stop firewalld 
systemctl disable firewalld
```


### Дистрибутив UBUNTU 18.4:

```
sudo apt-get install -y git
sudo apt-get install -y nodejs
sudo apt-get install -y npm
sudo npm install pm2 -g
sudo git clone https://github.com/terafoundation/wallet.git
cd wallet/Source
sudo npm install
sudo pm2 start run-node.js
```

### открытие портов:
```
sudo ufw allow 30000/tcp
sudo ufw allow 80/tcp
```



### Обновления

```
cd wallet
sudo git reset --hard 
sudo git pull 
```


## Спецификация
* Название: TERA
* Консенсус: PoW
* Алгоритм:  sha3 + meshhash (антиасик перемешивание)
* Максимальная эмиссия: 1 млрд (TER)
* Награда за блок: 1-20 монет, зависит от мощности сети (одна миллиардная часть от остатка нераспределенной суммы монет и умноженная на сотую часть квадрата логарифма мощности сети)
* Премайн: 5%
* Комиссия от майнинга: 1% (в фонд разработки)
* Время генерации блока: 1 секунда
* Время подтверждения блока: 8 секунд
* Размер блока: 120 Кбайт
* Скорость: от 1000 транзакций в секунду
* Комиссия в транзакциях: бесплатно
* Криптография: sha3, secp256k1
* Защита от ДДОС: PoW (расчет хеша)
* Платформа: Node.JS





## КОШЕЛЕК
### Запуск кошелька
Дождитесь окончания синхронизации - должна появиться зеленая надпись Synchronization complete Ниже ее при первом запуске появятся два поля: name и adviser. Введите код адвайзера (если он у вас есть), название счета и нажмите кнопку Create. 
Примерно через 8 секунд транзакция создания счета поместиться в блокчейн и у вас будет открыт счет, на который вы можете майнить монеты 
* Примечание: нужно иметь статический IP-адрес и открытый порт 30000 (его можно поменять в программе). Если вы имеете несколько нод на одном ip-адресе, то поставьте для них разные порты (30001,30002 и т.д.)

Кошелек имеет два режима ввода ключа. Приватный и публичный. Публичный нужен для работы кошелька в режиме просмотра и отправки уже подписанных транзакций (например через флешку с другого компьютера, который не подключен к сети)




## Реферальная программа майнинга

В первый год работы сети (когда номер блока находится в диапазоне от 2 млн до 30 млн) работает реферальная программа майнинга. Если майнер указал адвайзера в своем кошельке, то он получает примерно двукратный размер награды, а его адвайзер получает однократную награду. Таким образом при начале действии реферальной программы эмиссия примерно утраивается.
Технически адвайзер это номер счета, любой счет может стать адвайзером, при условии что он был создан более 1 млн блоков назад (т.е. примерно 12 дней).
В целях сглаживания кривой эмиссии, сумма награды за реферальный майнинг умножается на коэффициент, принимающий значение от 1 до 0. Коэффициент принимает значение равное 1 в начале запуска программы и плавно меняется до 0 к концу действия программы (до 30 млн-го блока).

### Пример расчета эмиссии монет:
Допустим сейчас мощность сети равняется 30 битам в хеше блока, а всего нераспределенных монет 1 млрд и мы находимся в самом начале действия программы майнинга, тогда одна награда равняется 900/100=9 монет.
Монеты распределяются следующим образом: 2 награды майнеру, 1 награда адвайзеру, а всего будет списано с системного  счета  27 монет (3*9 = 27).
В случае, когда мы находимся в середине реферальной программы майнинга, когда коэффициент равен 0.5, эмиссия принимает следующие значения в приведенном выше примере: 1.5 награды майнеру, 0.5 награда адвайзеру, а всего будет списано с системного  счета  18 монет (2*9 = 18).



## Описание принципа хранения монет
Монеты хранятся на счетах, по аналогии с банковскими счетами. Счета нумеруются с 0 по порядку. Нулевой номер счета имеет системный аккаунт, на который первоначально эмитировано 1 млрд монет. Для создания нового счета нужно в сеть отправить спец. транзакцию с кодом 100, в которой указывается публичный ключ владельца счета и необязательный параметр название счета (строка до 40 байт длины). Название желательно для проверки правильности ввода номера счета при отправке платежа.
Формат транзакции в JSON:
```js
{
   "Type": 100,
   "Currency": 0,
   "PubKey": "02AD1D9494A916E88927A7DDBE150C06E236EFEF6C5182DA878D6047F568104DE4",
   "Description": "Test",
   "RefID": 47,
}
```

### Транзакции
Минимальная сумма отправки 1 цент т.е. 0,000000001 (одна миллиардная) часть монеты.
Минимальный размер транзакции перевода монет со счета на счет равен 114 байтам. Такой размер получается в том случае, если указан один получатель и нет описания назначения платежа.
Транзакция в текстовом в формате JSON выглядит так:
```js
{
   "Type": 110,
   "Version": 2,
   "Currency": 0,
   "FromID": 1,
   "OperationID": 40167,
   "To":
       [
           {
               "ID": 2,
               "SumTER": 100,
               "SumCENT": 0
           }
       ],
   "Description": "test",
   "Sign": "B39C39D91136E92C5B9530ABC683D9A1AF51E27382AFC69EA3B1F14AD7C4CDBE46D36BD743F2B4AE7760F8DDE706D81FB8201ABBF27DABF6F1EC658FE432C141"
}
```
* Примечание: транзакция в примере выше имеет длину 118 байт

Version = 0 - цифровая подпись содержимого транзакции
Version = 2 - цифровая подпись содержимого транзакции + список 33 байтных публичных ключей получателей. Применяется для защиты от мутабельности аккаунтов при маленьком времени подтверждении. Например создается аккаунт и в следующий блок отправляется транзакция на перевод монет на этот счет. Потом транзакция из первого блока исчезает вследствии мутабельности блокчейн сети, в вместо нее создается другая транзакция создания счета - от неизвестной третьей стороны. В этом случае монеты не переведутся на неизвестный счет и они не будут потеряны, т.к. произойдет проверка соответствия публичного кошелька получателя требуемому значению.


Текстовое представление запаковывается в бинарный формат + добавляется 12 байт POW (для защиты от ДДОС).
Назначение платежа допускается до 200 байт. Вообще размер ограничен 65535 байтами, но 200 байт это размер который видят кошельки пользователей, большую длину они обрезают.
Чем больше длина транзакции, тем больше нужно выполнить расчет POW, чтобы транзакция была конкурентоспособна и попала в блок.


При каждом изменении таблицы счетов в блокчейн записывается хеш. Это реализуется с помощью специального типа транзакций с кодом 116.  Они запускаются системным DApp Accounts, который обслуживает таблицу счетов. 
Транзакция имеет формат:
```js
{
   "Type": 116,
   "BlockNum": 1500000,
   "Hash": "AB1429BC0FE5B28DB218F30D46AE9F953DC34059EA1A65A15775D73389A4EB51"
}
```


# FAQ

## Решения проблем с соединением (нет старта синхронизации)
* Проверьте наличие прямого ip-адреса (закажите  у провайдера)
* Проверьте проброшен ли порт от роутера до вашего компьютера
* Проверьте firewall (открыт ли порт на компьютере)




# Ссылки:
* Btt: https://bitcointalk.org/index.php?topic=4573801.0
* Twitter: https://twitter.com/terafoundation
* Telegram: https://t.me/Terafoundation
* Discord [RUS]: https://discord.gg/dzSGKyR


![image](https://hackmd.io/_uploads/B1SPvP3Nkx.png)

It's the festive season of Diwali, and a newly launched website, Bling-Bling Crackers (a fictional site, inspired by platforms like Amazon and Flipkart), is offering huge discounts and free gifts for new users. To celebrate the festival of lights, Deepam Mart has launched a "Diwali Dhamaka" sale, offering ₹1 products, 50% off discounts, and free gifts like Diwali decorations and sweets for first-time users. The company Bling-Bling Crackers uses StoreD.

# Bling-Bling
## Sherlock info
Name |Brutus
|-|-|
Difficulty| Easy
Category | SOC|

## Note from Scenario
- Liên quan đến service web?

## Tools use
- neo4j
- Neo4j Aura 

>### Comment
> Về bài Sherlocks này hơi khá chấm hỏi về việc điều tra trong db toàn phải đi tìm hiểu về query, về kỹ thuật sử dụng Neo4j lần trước lỏm được ở đâu (bloodhunt) nên cũng mang máng :))

# Question 
1. Total number of Nodes in the database?
2. How many Account nodes does the database have?
3. How many accounts are registered from the IP address 88.236.1.190?
4. How many Users have created multiple accounts with same IP address?
5. What physical address has been used multiple times?
6. Which Credit Card number is attached to multiple accounts?
7. When was the account with username obhandari created?
8. How many accounts using the credit card number from question 6 use the same registered IP address?

# Analysis 
Unzip ra ta nhận được file `neo4j-2024-10-27T12-05-17.backup`

Bài này có 2 cách để đọc file này. Nhưng cách dùng trực tiếp bằng cách build lại Neo4j của mình bị lỗi nên dùng cách còn lại dễ hơn đó là **Neo4j Aura** (không cài cắm, config gì) 

## Nodes in the database
Sử dụng query dưới là được câu trả lời 
```
MATCH (n) RETURN count(n);
```

![image](https://hackmd.io/_uploads/rkZ1mt2E1e.png)

## Account nodes
Dựa vào sơ đồ ta có thể thấy các mối quan hệ cho thấy các node Account được kết nối với các node Credit Card, trong thực tế thì TA sẽ thấy rõ cho các query sau này.

![image](https://hackmd.io/_uploads/HkfGDF2Nkl.png)

```
MATCH (n:Account) RETURN count(n);
```

## Accounts are registered
Mỗi node Account có một số thuộc tính, bao gồm `register_ip_address`, ghi lại IP được sử dụng trong quá trình đăng ký tài khoản. Sử dụng query sau để tìm số lượng Account được đăng ký với một IP cụ thể

```
match (n:Account) where n.register_ip_address = "88.236.1.190" return
count(n)
```

![image](https://hackmd.io/_uploads/SkI4ttnNJe.png)

## Users have created multiple accounts with same IP
```
MATCH (n:Account)
WITH n.register_ip_address AS prop1, COLLECT(n) AS nodes
WHERE SIZE(nodes) > 1
RETURN prop1, SIZE(nodes) AS duplicate_count
```

![image](https://hackmd.io/_uploads/HkhSsY341x.png)

22 + 16 = **38**

## Address has been used multiple 
```
MATCH (n:Account)
WITH n.address AS prop1, COLLECT(n) AS nodes
WHERE SIZE(nodes) > 1
RETURN prop1, SIZE(nodes) AS duplicate_count
```
![image](https://hackmd.io/_uploads/rkXqTthEyg.png)

## Credit Card number is attached to multiple accounts
```
MATCH (c:CreditCard)-[r:HAS_CREDITCARD]-()
WITH c, COUNT(r) AS relationship_count
WHERE relationship_count > 1
RETURN c, relationship_count
```

![image](https://hackmd.io/_uploads/rk16pKnE1l.png)

## Account with username obhandari created
```
MATCH (m:Account) WHERE m.username = "obhandari" RETURN m.created_at
```

## Accounts using the credit card number from question 6
```
MATCH (c:CreditCard)-[r:HAS_CREDITCARD]-()
WITH c, COUNT(r) AS relationship_count
WHERE relationship_count > 1
RETURN relationship_count
```

# Answer
1. 2802
2. 1406
3. 22
4. 38
5. 19/63, Krishnan Ganj, Danapur 441303
6. 371593995427734
7. 2024-11-08 07\:42:20.228775
8. 11

------------------------------------------ Kết thúc Sherlock! ------------------------------------------

![image](https://hackmd.io/_uploads/HyOByq2EJe.png)

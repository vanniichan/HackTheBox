![image](https://hackmd.io/_uploads/ByPwDIFtgg.png)

In this Sherlock, you will familiarize yourself with Sysmon logs and various useful EventIDs for identifying and analyzing malicious activities on a Windows system. Palo Alto's Unit42 recently conducted research on an UltraVNC campaign, wherein attackers utilized a backdoored version of UltraVNC to maintain access to systems. This lab is inspired by that campaign and guides participants through the initial access stage of the campaign.

# Unit42 
## Sherlock info
Name |TickTock
|-|-|
Difficulty| Very Easy
Category | DFIR|

## Note from Scenario
- Thực hiện tấn công và kết nối đến C2 
- Hoạt động liên quan đến timestomps 

## Tools use
- Event Viewer
- ChatGPT

>### Comment
> Hóng hớt VCS yêu cầu làm bài này nên làm trước

# Question
1. How many Event logs are there with Event ID 11?
2. Whenever a process is created in memory, an event with Event ID 1 is recorded with details such as command line, hashes, process path, parent process path, etc. This information is very useful for an analyst because it allows us to see all programs executed on a system, which means we can spot any malicious processes being executed. What is the malicious process that infected the victim's system?
3. Which Cloud drive was used to distribute the malware?
4. For many of the files it wrote to disk, the initial malicious file used a defense evasion technique called Time Stomping, where the file creation date is changed to make it appear older and blend in with other files. What was the timestamp changed to for the PDF file?
5. The malicious file dropped a few files on disk. Where was "once.cmd" created on disk? Please answer with the full path along with the filename.
6. The malicious file attempted to reach a dummy domain, most likely to check the internet connection status. What domain name did it try to connect to?
7. Which IP address did the malicious process try to reach out to?
8. The malicious process terminated itself after infecting the PC with a backdoored variant of UltraVNC. When did the process terminate itself?

# Analysis

![image](https://hackmd.io/_uploads/Bk34YUKtxe.png)

![image](https://hackmd.io/_uploads/BJZEAStYgl.png)

![image](https://hackmd.io/_uploads/B1Cg1Lttgg.png)

![image](https://hackmd.io/_uploads/HJDZkIFtgl.png)

![image](https://hackmd.io/_uploads/SJjSx8YYxx.png)

![image](https://hackmd.io/_uploads/B1BXg8FFxg.png)

![image](https://hackmd.io/_uploads/HJZpg8YKle.png)

![image](https://hackmd.io/_uploads/Hy6DbIKFle.png)

![image](https://hackmd.io/_uploads/BJyiZUKtee.png)

![image](https://hackmd.io/_uploads/Hk_WfIFKle.png)

```
<Data Name="QueryResults">::ffff:93.184.216.34;199.43.135.53;2001:500:8f::53;199.43.133.53;2001:500:8d::53;</Data>
```

```
<Data Name="QueryResults">
::ffff:93.184.216.34;
199.43.135.53;
2001:500:8f::53;
199.43.133.53;
2001:500:8d::53;
</Data>
```

![image](https://hackmd.io/_uploads/BJLnmIKFee.png)

![image](https://hackmd.io/_uploads/rJucH8KYxl.png)

![image](https://hackmd.io/_uploads/Syu_LIKKeg.png)

––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––

![image](https://hackmd.io/_uploads/BJ5RUIFtgx.png)



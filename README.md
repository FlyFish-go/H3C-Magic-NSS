# H3C Magic NSS：OpenWrt 主线 + NSS 硬件加速（H3C Magic NX30 / RC3000 / RT3000 / RW3000 系列）

本仓库只为 H3C Magic 系列（IPQ5018 / IPQ5000，256 MB 内存）构建 OpenWrt。它基于
[kuncy7/openwrt-nss-edma](https://github.com/kuncy7/openwrt-nss-edma)：OpenWrt 主线、内核 6.18，
加上高通 NSS 硬件加速（有线 NAT、Wi-Fi offload、PPPoE、VLAN、SQM 队列），以太网走上游的
`stmmac` 驱动。我们在上面加了四个硬件系列的板级支持和 256 MB 机型需要的调整。

镜像只带日常必需的部分：中文 LuCI（Aurora 主题）、NSS 状态页、TUN（Tailscale/OpenVPN 用）、
概览页按硬件计数的「端口流量」面板，以及内存压缩交换（zram）；LAN、Wi-Fi 默认设置和 r10 QSDK 相同。
其他插件（UPnP、DDNS、WireGuard、SQM 页面、网页终端等）按需自己安装，需要的内核模块在每个版本自己的软件仓库里（见下文「软件源」）。

> **测试版。** 这是给愿意尝鲜的用户的预览版，请保留另一个系统槽作退路。稳定使用请继续用
> [H3C-RT3000-Product-R1](https://github.com/FlyFish-go/H3C-RT3000-Product-R1) 的 QSDK 固件（r14）。
> 问题和测试结果请提 [Issue](https://github.com/FlyFish-go/H3C-Magic-NSS/issues)。

## 和 kuncy7 上游的区别

- 四个硬件系列的板级支持（与 OpenWrt 上游 PR [#26453](https://github.com/openwrt/openwrt/pull/26453) 相同的板子，
  改成本树的 NSS 绑定）。
- **NSS 固件用 12.2-156，不用 12.5-210。** 12.5 在这几台 256 MB 机器上，遇到重传多的 Wi-Fi 客户端
  （例如老的 11n/11ac USB 网卡）会不断占住 NSS 缓冲，几分钟后有线就断流，最后 hostapd 被 OOM 杀掉。
  12.2 没有这个问题。详情见 [kuncy7/openwrt-nss-edma#64](https://github.com/kuncy7/openwrt-nss-edma/issues/64)。
- 256 MB 机型的内存调整（NSS 主机缓冲池上限、VM 预留），默认设置下 5G 满速下载会 OOM。
- 引导程序传入的 NAND ECC 强度（QPIC），以及 H3C 原厂网页升级包格式（`mkh3cqca`）。
- 镜像自带 LuCI 和日常使用的默认设置（上游镜像不带 LuCI、Wi-Fi 默认关闭）；NSS 状态页加了简体中文翻译。
- 修复：射频在 netifd 启动之后才加载时，全新配置下 netifd 读不到无线配置，默认开启的 Wi-Fi 起不来。
- 修复：NSS 固件接管网卡时，网卡里没发完的包让发送队列一直停着，开机后可能出现发送超时、LAN 口全断（已提交上游 [kuncy7/openwrt-nss-edma#74](https://github.com/kuncy7/openwrt-nss-edma/pull/74)）。
- 「端口流量」面板（状态 → 概览）：NSS 接管后接口统计不再计数，面板改读交换芯片和网卡的硬件计数器。
- 每个版本发布自己的软件仓库（内核模块、`libstdcpp6` 等工具链库、本树的软件包），镜像默认使用它。
- 仓库里还有官方源没有的代理插件：OpenClash（`apk add luci-app-openclash`）和 PassWall（`apk add h3c-passwall`，连同 Xray 和透明代理需要的组件一次装好）。
- 在线更新：「系统 → 备份/升级 → 在线更新」检测、下载、校验并安装新版本（目前只支持 HW-B，默认不自动检测）。

这些改动会继续提交给上游；上游合并后这里也会跟进。

## 选哪个镜像

| 硬件系列 | 镜像文件里的设备名 |
|---|---|
| HW-A | `h3c_magic-rc3000-v2` |
| HW-B | `h3c_magic-rc3000-v1` |
| HW-C | `h3c_magic-rc3000-v3` |
| HW-D | `h3c_magic-nx30` |

硬件系列看 [H3C-NX30-Uboot](https://github.com/FlyFish-go/H3C-NX30-Uboot) 救援页的系统信息。同一个零售型号可能是不同的硬件系列，**不要按型号选镜像**。

## 安装

需要 [H3C-NX30-Uboot](https://github.com/FlyFish-go/H3C-NX30-Uboot) v0.1.0 或更新。

1. 进入 U-Boot 救援页，在「固件更新」把 `*-factory.ubi` 写进**你不需要的那个系统槽**
   （另一个槽保留原厂系统或 r10 QSDK，出问题可以切回去）。
2. 在启动选择里从这个槽启动，确认能用后再设为默认。
3. 首次启动：管理地址 `http://192.168.10.1`（和 r10 QSDK 相同），root 没有密码，**请先在 LuCI 里设置密码**。
   Wi-Fi 双频默认打开：`OpenWrt`（2.4 GHz）和 `OpenWrt-5G`，密码 `12345678`，国家码 CN，**请尽快修改**。
   时区为上海，界面为简体中文。

已经在用本仓库的固件：系统内升级用 `*-sysupgrade.bin`（可以保留配置）。保留配置升级时，原来的 LAN 地址、
Wi-Fi 和时区都不变（从 v0.1.0-pre.1 升级仍是 `192.168.1.1`），只新增 LuCI；想用新的默认设置请不保留配置。

**不要**从 r10 QSDK 里直接 sysupgrade 到本固件，分区和系统都不同；请用救援页写另一个槽。

## 已知情况

- 软件源：`apk update && apk add <包名>`，或在 LuCI「系统 → 软件包」里装。LuCI 应用和工具来自 OpenWrt 官方 snapshot 源；
  内核模块和工具链库（`libstdcpp6` 等）来自本版本自己的仓库
  `https://flyfish-go.github.io/H3C-Magic-NSS/<版本>/`（从 v0.1.0-pre.4 起，用本镜像的密钥签名）。
  官方源的 kmod 是给另一个内核编的，装不上；仓库里没有的模块请提 Issue。
  例如 WireGuard：`apk add luci-proto-wireguard`（自动装上 `kmod-wireguard`）。
  官方 snapshot 每天更新，单独装软件没问题，**不要 `apk upgrade` 整体升级**；升级固件后，自己装的软件需要重新安装。
- 内存：可用内存约 170 MiB（其余给 NSS 和 Wi-Fi 固件），镜像带 zram 压缩交换。AdGuard Home 这类 Go 程序加上大的拦截列表会很吃内存，
  建议只用一份默认规模的列表。
- 代理插件（OpenClash、PassWall 加 Xray）在双系统布局下放不下（overlay 约 15 MB），需要 U-Boot 救援页的大分区（单系统 80 MiB）；本固件也能直接用于下一版 U-Boot 的超大分区（116 MiB）。
- 有线 NAT 受单个 CPU 端口限制，上限约 940 Mbit/s。
- `ip -s link` 和 `/sys/class/net/*/statistics` 不统计被 NSS 加速的流量，请看「端口流量」面板或 `ethtool -S`。
- 还没有做长时间稳定性测试，这正是需要大家帮忙的：跑几天，把 `logread`、`dmesg`、
  `cat /sys/kernel/debug/qca-nss-drv/stats/n2h` 发到 Issue。

## 自己编译

```
./scripts/feeds update -a && ./scripts/feeds install -a
cat .github/ci/ipq50xx/common.config .github/ci/ipq50xx/kmods-extra.config .github/ci/ipq50xx/h3c.config > .config
make defconfig && make -j$(nproc)
```

NSS 部分的结构、拓扑和移植说明见 [README.ipq50xx.md](README.ipq50xx.md)，上游项目的原始首页见 [README.upstream.md](README.upstream.md)（均为 kuncy7 编写）。

## English

OpenWrt main (kernel 6.18) with Qualcomm NSS offload, built only for the H3C Magic family
(IPQ5018/IPQ5000, 256 MB): HW-A = `h3c_magic-rc3000-v2`, HW-B = `h3c_magic-rc3000-v1`,
HW-C = `h3c_magic-rc3000-v3`, HW-D = `h3c_magic-nx30`. Based on kuncy7/openwrt-nss-edma; adds the
board support (same boards as openwrt/openwrt#26453), 256 MB memory tuning, and builds with NSS
firmware 12.2-156 because 12.5-210 leaks host payload buffers on these boards with high-retry Wi-Fi
clients (kuncy7/openwrt-nss-edma#64). Install `*-factory.ubi` into a spare slot from the
H3C-NX30-Uboot (v0.1.0+) rescue page; upgrade with `*-sysupgrade.bin`. The images are lean: LuCI
(Chinese, Aurora theme), the NSS status page, kmod-tun, a port traffic table and zram swap; other apps
install from the official feeds, and each release publishes its own package repository (kernel modules,
toolchain libraries such as libstdcpp6) on GitHub Pages, which the image uses instead of the official
target feed. Defaults are the QSDK ones: LAN 192.168.10.1, Wi-Fi `OpenWrt` / `OpenWrt-5G` with key
`12345678`, country CN - change the passwords. Preview quality: report issues here.

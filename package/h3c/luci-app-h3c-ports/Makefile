# SPDX-License-Identifier: Apache-2.0
#
# Status -> Overview: per-port traffic from the hardware counters.

include $(TOPDIR)/rules.mk

LUCI_TITLE:=Port traffic from the switch and GMAC hardware counters
LUCI_DESCRIPTION:=Shows link, speed, current rate and total bytes of every \
 LAN/WAN port on Status -> Overview. With NSS offload most packets bypass \
 the Linux driver, so the interface statistics stop counting; this view \
 reads the switch MIB and GMAC MMC counters through ethtool instead.
LUCI_DEPENDS:=+luci-mod-status +rpcd-mod-ucode +ucode-mod-fs +ethtool
LUCI_PKGARCH:=all

PKG_LICENSE:=Apache-2.0

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature

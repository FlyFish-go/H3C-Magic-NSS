# SPDX-License-Identifier: GPL-2.0-only
#
# First-boot defaults of the H3C Magic NSS images: the same LAN subnet,
# Wi-Fi defaults and region as the H3C QSDK images, and a Chinese LuCI.

include $(TOPDIR)/rules.mk

PKG_NAME:=h3c-magic-defaults
PKG_RELEASE:=2
PKG_LICENSE:=GPL-2.0-only

include $(INCLUDE_DIR)/package.mk

define Package/h3c-magic-defaults
  SECTION:=base
  CATEGORY:=Base system
  TITLE:=First-boot defaults for the H3C Magic NSS images
  DEPENDS:=@TARGET_qualcommax_ipq50xx
  PKGARCH:=all
endef

define Package/h3c-magic-defaults/description
 For a fresh configuration on the H3C Magic NX30 and RC3000 v1/v2/v3:
 LAN 192.168.10.1, both Wi-Fi bands up with WPA2 (OpenWrt / OpenWrt-5G,
 key 12345678), country CN, time zone Asia/Shanghai with NTP servers in
 China, and LuCI in Simplified Chinese. A keep-settings sysupgrade keeps
 the user's network, Wi-Fi and LuCI settings.
endef

define Build/Compile
endef

define Package/h3c-magic-defaults/install
	$(INSTALL_DIR) $(1)/etc/board.d $(1)/etc/uci-defaults
	$(INSTALL_DATA) ./files/etc/board.d/99_h3c_magic_defaults $(1)/etc/board.d/
	$(INSTALL_BIN) ./files/etc/uci-defaults/99-h3c-magic-defaults $(1)/etc/uci-defaults/
endef

$(eval $(call BuildPackage,h3c-magic-defaults))

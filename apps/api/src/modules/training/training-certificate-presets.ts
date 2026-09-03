export interface TrainingCertificateBackgroundPreset {
  key: string;
  name: string;
  description: string;
  svg: string;
}

const presets: TrainingCertificateBackgroundPreset[] = [
  {
    key: 'style-1',
    name: 'Style 1 — OdooKRD Vector',
    description: 'Ornamental OdooKRD vector certificate background.',
    svg: String.raw`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="2400" height="1697" viewBox="0 0 2400 1697">
  <defs>
    <linearGradient id="fadeTop" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#9e7cab" stop-opacity="0.22"/>
      <stop offset="72%" stop-color="#9e7cab" stop-opacity="0.09"/>
      <stop offset="100%" stop-color="#9e7cab" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fadeBottom" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#9e7cab" stop-opacity="0"/>
      <stop offset="18%" stop-color="#9e7cab" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#9e7cab" stop-opacity="0.22"/>
    </linearGradient>
  </defs>

  <!-- White certificate field -->
  <rect width="2400" height="1697" fill="#ffffff"/>

  <!-- Outer ornamental frame -->
  <path d="
    M 120 40
    H 2280
    C 2280 78, 2308 108, 2350 110
    V 1587
    C 2308 1590, 2280 1618, 2280 1657
    H 120
    C 120 1618, 92 1590, 50 1587
    V 110
    C 92 108, 120 78, 120 40
    Z"
    fill="none" stroke="#9573a6" stroke-width="5"/>

  <!-- Inner solid frame -->
  <path d="
    M 135 58
    H 2265
    C 2266 90, 2292 116, 2327 120
    V 1577
    C 2292 1581, 2266 1607, 2265 1639
    H 135
    C 134 1607, 108 1581, 73 1577
    V 120
    C 108 116, 134 90, 135 58
    Z"
    fill="none" stroke="#b59bc2" stroke-width="2.3"/>

  <!-- Dotted inner frame -->
  <path d="
    M 150 72
    H 2250
    C 2252 99, 2275 121, 2304 126
    V 1571
    C 2275 1576, 2252 1598, 2250 1625
    H 150
    C 148 1598, 125 1576, 96 1571
    V 126
    C 125 121, 148 99, 150 72
    Z"
    fill="none" stroke="#a886b6" stroke-width="2"
    stroke-linecap="round" stroke-dasharray="1 10"/>

  <!-- Top guilloche -->
  <g fill="none" stroke="url(#fadeTop)" stroke-width="1.05">
    <path d="M 80 95.0 C 260 41.0, 450 149.0, 650 107.0 S 1020 77.0, 1380 103.0" /><path d="M 80 98.0 C 260 42.8, 450 153.2, 650 110.0 S 1020 79.5, 1380 106.0" /><path d="M 80 101.0 C 260 44.6, 450 157.4, 650 113.0 S 1020 82.0, 1380 109.0" /><path d="M 80 104.0 C 260 46.4, 450 161.6, 650 116.0 S 1020 84.5, 1380 112.0" /><path d="M 80 107.0 C 260 48.2, 450 165.8, 650 119.0 S 1020 87.0, 1380 115.0" /><path d="M 80 110.0 C 260 50.0, 450 170.0, 650 122.0 S 1020 89.5, 1380 118.0" /><path d="M 80 113.0 C 260 51.8, 450 174.2, 650 125.0 S 1020 92.0, 1380 121.0" /><path d="M 80 116.0 C 260 53.6, 450 178.4, 650 128.0 S 1020 94.5, 1380 124.0" /><path d="M 80 119.0 C 260 55.4, 450 182.6, 650 131.0 S 1020 97.0, 1380 127.0" /><path d="M 80 122.0 C 260 57.2, 450 186.8, 650 134.0 S 1020 99.5, 1380 130.0" /><path d="M 80 125.0 C 260 59.0, 450 191.0, 650 137.0 S 1020 102.0, 1380 133.0" /><path d="M 80 128.0 C 260 60.8, 450 195.2, 650 140.0 S 1020 104.5, 1380 136.0" /><path d="M 80 131.0 C 260 62.6, 450 199.4, 650 143.0 S 1020 107.0, 1380 139.0" /><path d="M 80 134.0 C 260 64.4, 450 203.6, 650 146.0 S 1020 109.5, 1380 142.0" /><path d="M 80 137.0 C 260 66.2, 450 207.8, 650 149.0 S 1020 112.0, 1380 145.0" /><path d="M 80 140.0 C 260 68.0, 450 212.0, 650 152.0 S 1020 114.5, 1380 148.0" /><path d="M 80 143.0 C 260 69.8, 450 216.2, 650 155.0 S 1020 117.0, 1380 151.0" /><path d="M 80 146.0 C 260 71.6, 450 220.4, 650 158.0 S 1020 119.5, 1380 154.0" /><path d="M 80 149.0 C 260 73.4, 450 224.6, 650 161.0 S 1020 122.0, 1380 157.0" /><path d="M 80 152.0 C 260 75.2, 450 228.8, 650 164.0 S 1020 124.5, 1380 160.0" /><path d="M 80 155.0 C 260 77.0, 450 233.0, 650 167.0 S 1020 127.0, 1380 163.0" /><path d="M 80 158.0 C 260 78.8, 450 237.2, 650 170.0 S 1020 129.5, 1380 166.0" /><path d="M 80 161.0 C 260 80.6, 450 241.4, 650 173.0 S 1020 132.0, 1380 169.0" /><path d="M 80 164.0 C 260 82.4, 450 245.6, 650 176.0 S 1020 134.5, 1380 172.0" /><path d="M 80 167.0 C 260 84.2, 450 249.8, 650 179.0 S 1020 137.0, 1380 175.0" /><path d="M 80 170.0 C 260 86.0, 450 254.0, 650 182.0 S 1020 139.5, 1380 178.0" />
  </g>

  <!-- Bottom guilloche -->
  <g fill="none" stroke="url(#fadeBottom)" stroke-width="1.05">
    <path d="M 650 1550.0 C 900 1582.0, 1090 1518.0, 1280 1544.0 S 1580 1608.0, 1760 1558.0 S 2120 1492.0, 2340 1545.0" /><path d="M 650 1552.4 C 900 1585.8, 1090 1519.0, 1280 1546.4 S 1580 1611.6, 1760 1560.4 S 2120 1493.2, 2340 1547.4" /><path d="M 650 1554.8 C 900 1589.6, 1090 1520.0, 1280 1548.8 S 1580 1615.2, 1760 1562.8 S 2120 1494.4, 2340 1549.8" /><path d="M 650 1557.2 C 900 1593.4, 1090 1521.0, 1280 1551.2 S 1580 1618.8, 1760 1565.2 S 2120 1495.6, 2340 1552.2" /><path d="M 650 1559.6 C 900 1597.2, 1090 1522.0, 1280 1553.6 S 1580 1622.4, 1760 1567.6 S 2120 1496.8, 2340 1554.6" /><path d="M 650 1562.0 C 900 1601.0, 1090 1523.0, 1280 1556.0 S 1580 1626.0, 1760 1570.0 S 2120 1498.0, 2340 1557.0" /><path d="M 650 1564.4 C 900 1604.8, 1090 1524.0, 1280 1558.4 S 1580 1629.6, 1760 1572.4 S 2120 1499.2, 2340 1559.4" /><path d="M 650 1566.8 C 900 1608.6, 1090 1525.0, 1280 1560.8 S 1580 1633.2, 1760 1574.8 S 2120 1500.4, 2340 1561.8" /><path d="M 650 1569.2 C 900 1612.4, 1090 1526.0, 1280 1563.2 S 1580 1636.8, 1760 1577.2 S 2120 1501.6, 2340 1564.2" /><path d="M 650 1571.6 C 900 1616.2, 1090 1527.0, 1280 1565.6 S 1580 1640.4, 1760 1579.6 S 2120 1502.8, 2340 1566.6" /><path d="M 650 1574.0 C 900 1620.0, 1090 1528.0, 1280 1568.0 S 1580 1644.0, 1760 1582.0 S 2120 1504.0, 2340 1569.0" /><path d="M 650 1576.4 C 900 1623.8, 1090 1529.0, 1280 1570.4 S 1580 1647.6, 1760 1584.4 S 2120 1505.2, 2340 1571.4" /><path d="M 650 1578.8 C 900 1627.6, 1090 1530.0, 1280 1572.8 S 1580 1651.2, 1760 1586.8 S 2120 1506.4, 2340 1573.8" /><path d="M 650 1581.2 C 900 1631.4, 1090 1531.0, 1280 1575.2 S 1580 1654.8, 1760 1589.2 S 2120 1507.6, 2340 1576.2" /><path d="M 650 1583.6 C 900 1635.2, 1090 1532.0, 1280 1577.6 S 1580 1658.4, 1760 1591.6 S 2120 1508.8, 2340 1578.6" /><path d="M 650 1586.0 C 900 1639.0, 1090 1533.0, 1280 1580.0 S 1580 1662.0, 1760 1594.0 S 2120 1510.0, 2340 1581.0" /><path d="M 650 1588.4 C 900 1642.8, 1090 1534.0, 1280 1582.4 S 1580 1665.6, 1760 1596.4 S 2120 1511.2, 2340 1583.4" /><path d="M 650 1590.8 C 900 1646.6, 1090 1535.0, 1280 1584.8 S 1580 1669.2, 1760 1598.8 S 2120 1512.4, 2340 1585.8" /><path d="M 650 1593.2 C 900 1650.4, 1090 1536.0, 1280 1587.2 S 1580 1672.8, 1760 1601.2 S 2120 1513.6, 2340 1588.2" /><path d="M 650 1595.6 C 900 1654.2, 1090 1537.0, 1280 1589.6 S 1580 1676.4, 1760 1603.6 S 2120 1514.8, 2340 1590.6" /><path d="M 650 1598.0 C 900 1658.0, 1090 1538.0, 1280 1592.0 S 1580 1680.0, 1760 1606.0 S 2120 1516.0, 2340 1593.0" /><path d="M 650 1600.4 C 900 1661.8, 1090 1539.0, 1280 1594.4 S 1580 1683.6, 1760 1608.4 S 2120 1517.2, 2340 1595.4" /><path d="M 650 1602.8 C 900 1665.6, 1090 1540.0, 1280 1596.8 S 1580 1687.2, 1760 1610.8 S 2120 1518.4, 2340 1597.8" /><path d="M 650 1605.2 C 900 1669.4, 1090 1541.0, 1280 1599.2 S 1580 1690.8, 1760 1613.2 S 2120 1519.6, 2340 1600.2" /><path d="M 650 1607.6 C 900 1673.2, 1090 1542.0, 1280 1601.6 S 1580 1694.4, 1760 1615.6 S 2120 1520.8, 2340 1602.6" /><path d="M 650 1610.0 C 900 1677.0, 1090 1543.0, 1280 1604.0 S 1580 1698.0, 1760 1618.0 S 2120 1522.0, 2340 1605.0" /><path d="M 650 1612.4 C 900 1680.8, 1090 1544.0, 1280 1606.4 S 1580 1701.6, 1760 1620.4 S 2120 1523.2, 2340 1607.4" /><path d="M 650 1614.8 C 900 1684.6, 1090 1545.0, 1280 1608.8 S 1580 1705.2, 1760 1622.8 S 2120 1524.4, 2340 1609.8" />
  </g>

  <!-- Lower-left geometric texture -->
  <g>
    <polygon points="125.0,615.0 164.0,682.5 86.0,682.5" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.160"/>
<polygon points="125.0,615.0 164.0,682.5 125.0,654.2" fill="#bda8c8" opacity="0.080"/>
<polygon points="203.0,615.0 242.0,682.5 164.0,682.5" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.153"/>
<polygon points="281.0,615.0 320.0,682.5 242.0,682.5" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.145"/>
<polygon points="359.0,615.0 398.0,682.5 320.0,682.5" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.138"/>
<polygon points="437.0,615.0 476.0,682.5 398.0,682.5" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.131"/>
<polygon points="515.0,615.0 554.0,682.5 476.0,682.5" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.123"/>
<polygon points="515.0,615.0 554.0,682.5 515.0,654.2" fill="#bda8c8" opacity="0.062"/>
<polygon points="593.0,615.0 632.0,682.5 554.0,682.5" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.116"/>
<polygon points="164.0,682.5 203.0,750.1 125.0,750.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.154"/>
<polygon points="242.0,682.5 281.0,750.1 203.0,750.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.146"/>
<polygon points="320.0,682.5 359.0,750.1 281.0,750.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.139"/>
<polygon points="320.0,682.5 359.0,750.1 320.0,721.7" fill="#bda8c8" opacity="0.070"/>
<polygon points="398.0,682.5 437.0,750.1 359.0,750.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.132"/>
<polygon points="476.0,682.5 515.0,750.1 437.0,750.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.124"/>
<polygon points="554.0,682.5 593.0,750.1 515.0,750.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.117"/>
<polygon points="632.0,682.5 671.0,750.1 593.0,750.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.110"/>
<polygon points="125.0,750.1 164.0,817.6 86.0,817.6" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.147"/>
<polygon points="203.0,750.1 242.0,817.6 164.0,817.6" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.140"/>
<polygon points="281.0,750.1 320.0,817.6 242.0,817.6" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.133"/>
<polygon points="359.0,750.1 398.0,817.6 320.0,817.6" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.125"/>
<polygon points="437.0,750.1 476.0,817.6 398.0,817.6" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.118"/>
<polygon points="437.0,750.1 476.0,817.6 437.0,789.3" fill="#bda8c8" opacity="0.059"/>
<polygon points="515.0,750.1 554.0,817.6 476.0,817.6" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.111"/>
<polygon points="593.0,750.1 632.0,817.6 554.0,817.6" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.103"/>
<polygon points="164.0,817.6 203.0,885.2 125.0,885.2" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.141"/>
<polygon points="242.0,817.6 281.0,885.2 203.0,885.2" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.134"/>
<polygon points="242.0,817.6 281.0,885.2 242.0,856.8" fill="#bda8c8" opacity="0.067"/>
<polygon points="320.0,817.6 359.0,885.2 281.0,885.2" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.126"/>
<polygon points="398.0,817.6 437.0,885.2 359.0,885.2" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.119"/>
<polygon points="476.0,817.6 515.0,885.2 437.0,885.2" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.112"/>
<polygon points="554.0,817.6 593.0,885.2 515.0,885.2" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.104"/>
<polygon points="632.0,817.6 671.0,885.2 593.0,885.2" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.097"/>
<polygon points="632.0,817.6 671.0,885.2 632.0,856.8" fill="#bda8c8" opacity="0.049"/>
<polygon points="125.0,885.2 164.0,952.7 86.0,952.7" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.135"/>
<polygon points="203.0,885.2 242.0,952.7 164.0,952.7" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.128"/>
<polygon points="281.0,885.2 320.0,952.7 242.0,952.7" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.120"/>
<polygon points="359.0,885.2 398.0,952.7 320.0,952.7" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.113"/>
<polygon points="359.0,885.2 398.0,952.7 359.0,924.4" fill="#bda8c8" opacity="0.056"/>
<polygon points="437.0,885.2 476.0,952.7 398.0,952.7" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.106"/>
<polygon points="515.0,885.2 554.0,952.7 476.0,952.7" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.098"/>
<polygon points="593.0,885.2 632.0,952.7 554.0,952.7" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.091"/>
<polygon points="164.0,952.7 203.0,1020.3 125.0,1020.3" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.129"/>
<polygon points="164.0,952.7 203.0,1020.3 164.0,991.9" fill="#bda8c8" opacity="0.064"/>
<polygon points="242.0,952.7 281.0,1020.3 203.0,1020.3" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.121"/>
<polygon points="320.0,952.7 359.0,1020.3 281.0,1020.3" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.114"/>
<polygon points="398.0,952.7 437.0,1020.3 359.0,1020.3" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.107"/>
<polygon points="476.0,952.7 515.0,1020.3 437.0,1020.3" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.099"/>
<polygon points="554.0,952.7 593.0,1020.3 515.0,1020.3" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.092"/>
<polygon points="554.0,952.7 593.0,1020.3 554.0,991.9" fill="#bda8c8" opacity="0.046"/>
<polygon points="632.0,952.7 671.0,1020.3 593.0,1020.3" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.085"/>
<polygon points="125.0,1020.3 164.0,1087.8 86.0,1087.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.122"/>
<polygon points="203.0,1020.3 242.0,1087.8 164.0,1087.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.115"/>
<polygon points="281.0,1020.3 320.0,1087.8 242.0,1087.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.108"/>
<polygon points="281.0,1020.3 320.0,1087.8 281.0,1059.5" fill="#bda8c8" opacity="0.054"/>
<polygon points="359.0,1020.3 398.0,1087.8 320.0,1087.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.100"/>
<polygon points="437.0,1020.3 476.0,1087.8 398.0,1087.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.093"/>
<polygon points="515.0,1020.3 554.0,1087.8 476.0,1087.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.086"/>
<polygon points="593.0,1020.3 632.0,1087.8 554.0,1087.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.078"/>
<polygon points="164.0,1087.8 203.0,1155.4 125.0,1155.4" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.116"/>
<polygon points="242.0,1087.8 281.0,1155.4 203.0,1155.4" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.109"/>
<polygon points="320.0,1087.8 359.0,1155.4 281.0,1155.4" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.101"/>
<polygon points="398.0,1087.8 437.0,1155.4 359.0,1155.4" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.094"/>
<polygon points="476.0,1087.8 515.0,1155.4 437.0,1155.4" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.087"/>
<polygon points="476.0,1087.8 515.0,1155.4 476.0,1127.0" fill="#bda8c8" opacity="0.043"/>
<polygon points="554.0,1087.8 593.0,1155.4 515.0,1155.4" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.079"/>
<polygon points="632.0,1087.8 671.0,1155.4 593.0,1155.4" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.072"/>
  </g>

  <!-- Upper-right geometric texture -->
  <g transform="translate(2400,0) scale(-1,1)">
    <polygon points="120.0,85.0 158.0,150.8 82.0,150.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.160"/>
<polygon points="120.0,85.0 158.0,150.8 120.0,123.2" fill="#bda8c8" opacity="0.080"/>
<polygon points="196.0,85.0 234.0,150.8 158.0,150.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.153"/>
<polygon points="272.0,85.0 310.0,150.8 234.0,150.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.145"/>
<polygon points="348.0,85.0 386.0,150.8 310.0,150.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.138"/>
<polygon points="424.0,85.0 462.0,150.8 386.0,150.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.131"/>
<polygon points="500.0,85.0 538.0,150.8 462.0,150.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.123"/>
<polygon points="500.0,85.0 538.0,150.8 500.0,123.2" fill="#bda8c8" opacity="0.062"/>
<polygon points="576.0,85.0 614.0,150.8 538.0,150.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.116"/>
<polygon points="158.0,150.8 196.0,216.6 120.0,216.6" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.151"/>
<polygon points="234.0,150.8 272.0,216.6 196.0,216.6" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.144"/>
<polygon points="310.0,150.8 348.0,216.6 272.0,216.6" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.137"/>
<polygon points="310.0,150.8 348.0,216.6 310.0,189.0" fill="#bda8c8" opacity="0.068"/>
<polygon points="386.0,150.8 424.0,216.6 348.0,216.6" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.129"/>
<polygon points="462.0,150.8 500.0,216.6 424.0,216.6" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.122"/>
<polygon points="538.0,150.8 576.0,216.6 500.0,216.6" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.115"/>
<polygon points="614.0,150.8 652.0,216.6 576.0,216.6" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.107"/>
<polygon points="120.0,216.6 158.0,282.5 82.0,282.5" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.142"/>
<polygon points="196.0,216.6 234.0,282.5 158.0,282.5" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.135"/>
<polygon points="272.0,216.6 310.0,282.5 234.0,282.5" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.128"/>
<polygon points="348.0,216.6 386.0,282.5 310.0,282.5" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.120"/>
<polygon points="424.0,216.6 462.0,282.5 386.0,282.5" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.113"/>
<polygon points="424.0,216.6 462.0,282.5 424.0,254.8" fill="#bda8c8" opacity="0.057"/>
<polygon points="500.0,216.6 538.0,282.5 462.0,282.5" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.106"/>
<polygon points="576.0,216.6 614.0,282.5 538.0,282.5" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.098"/>
<polygon points="158.0,282.5 196.0,348.3 120.0,348.3" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.134"/>
<polygon points="234.0,282.5 272.0,348.3 196.0,348.3" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.126"/>
<polygon points="234.0,282.5 272.0,348.3 234.0,320.6" fill="#bda8c8" opacity="0.063"/>
<polygon points="310.0,282.5 348.0,348.3 272.0,348.3" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.119"/>
<polygon points="386.0,282.5 424.0,348.3 348.0,348.3" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.112"/>
<polygon points="462.0,282.5 500.0,348.3 424.0,348.3" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.104"/>
<polygon points="538.0,282.5 576.0,348.3 500.0,348.3" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.097"/>
<polygon points="614.0,282.5 652.0,348.3 576.0,348.3" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.090"/>
<polygon points="614.0,282.5 652.0,348.3 614.0,320.6" fill="#bda8c8" opacity="0.045"/>
<polygon points="120.0,348.3 158.0,414.1 82.0,414.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.125"/>
<polygon points="196.0,348.3 234.0,414.1 158.0,414.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.117"/>
<polygon points="272.0,348.3 310.0,414.1 234.0,414.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.110"/>
<polygon points="348.0,348.3 386.0,414.1 310.0,414.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.103"/>
<polygon points="348.0,348.3 386.0,414.1 348.0,386.4" fill="#bda8c8" opacity="0.051"/>
<polygon points="424.0,348.3 462.0,414.1 386.0,414.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.095"/>
<polygon points="500.0,348.3 538.0,414.1 462.0,414.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.088"/>
<polygon points="576.0,348.3 614.0,414.1 538.0,414.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.081"/>
<polygon points="158.0,414.1 196.0,479.9 120.0,479.9" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.116"/>
<polygon points="158.0,414.1 196.0,479.9 158.0,452.3" fill="#bda8c8" opacity="0.058"/>
<polygon points="234.0,414.1 272.0,479.9 196.0,479.9" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.109"/>
<polygon points="310.0,414.1 348.0,479.9 272.0,479.9" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.101"/>
<polygon points="386.0,414.1 424.0,479.9 348.0,479.9" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.094"/>
<polygon points="462.0,414.1 500.0,479.9 424.0,479.9" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.087"/>
<polygon points="538.0,414.1 576.0,479.9 500.0,479.9" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.079"/>
<polygon points="538.0,414.1 576.0,479.9 538.0,452.3" fill="#bda8c8" opacity="0.040"/>
<polygon points="614.0,414.1 652.0,479.9 576.0,479.9" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.072"/>
  </g>

  <!-- Right-middle faint continuation -->
  <g transform="translate(2400,0) scale(-1,1)" opacity="0.45">
    <polygon points="95.0,650.0 131.0,712.4 59.0,712.4" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.100"/>
<polygon points="95.0,650.0 131.0,712.4 95.0,686.2" fill="#bda8c8" opacity="0.050"/>
<polygon points="167.0,650.0 203.0,712.4 131.0,712.4" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.093"/>
<polygon points="239.0,650.0 275.0,712.4 203.0,712.4" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.086"/>
<polygon points="311.0,650.0 347.0,712.4 275.0,712.4" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.079"/>
<polygon points="383.0,650.0 419.0,712.4 347.0,712.4" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.073"/>
<polygon points="131.0,712.4 167.0,774.7 95.0,774.7" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.093"/>
<polygon points="203.0,712.4 239.0,774.7 167.0,774.7" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.086"/>
<polygon points="275.0,712.4 311.0,774.7 239.0,774.7" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.079"/>
<polygon points="275.0,712.4 311.0,774.7 275.0,748.5" fill="#bda8c8" opacity="0.040"/>
<polygon points="347.0,712.4 383.0,774.7 311.0,774.7" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.073"/>
<polygon points="419.0,712.4 455.0,774.7 383.0,774.7" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.066"/>
<polygon points="95.0,774.7 131.0,837.1 59.0,837.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.086"/>
<polygon points="167.0,774.7 203.0,837.1 131.0,837.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.079"/>
<polygon points="239.0,774.7 275.0,837.1 203.0,837.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.073"/>
<polygon points="311.0,774.7 347.0,837.1 275.0,837.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.066"/>
<polygon points="383.0,774.7 419.0,837.1 347.0,837.1" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.059"/>
<polygon points="383.0,774.7 419.0,837.1 383.0,810.9" fill="#bda8c8" opacity="0.029"/>
<polygon points="131.0,837.1 167.0,899.4 95.0,899.4" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.079"/>
<polygon points="203.0,837.1 239.0,899.4 167.0,899.4" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.073"/>
<polygon points="203.0,837.1 239.0,899.4 203.0,873.2" fill="#bda8c8" opacity="0.036"/>
<polygon points="275.0,837.1 311.0,899.4 239.0,899.4" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.066"/>
<polygon points="347.0,837.1 383.0,899.4 311.0,899.4" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.059"/>
<polygon points="419.0,837.1 455.0,899.4 383.0,899.4" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.052"/>
<polygon points="95.0,899.4 131.0,961.8 59.0,961.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.073"/>
<polygon points="167.0,899.4 203.0,961.8 131.0,961.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.066"/>
<polygon points="239.0,899.4 275.0,961.8 203.0,961.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.059"/>
<polygon points="311.0,899.4 347.0,961.8 275.0,961.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.052"/>
<polygon points="311.0,899.4 347.0,961.8 311.0,935.6" fill="#bda8c8" opacity="0.026"/>
<polygon points="383.0,899.4 419.0,961.8 347.0,961.8" fill="none" stroke="#9b7baa" stroke-width="1.1" opacity="0.045"/>
  </g>
</svg>`,
  },
  {
    key: 'style-2',
    name: 'Style 2 — Corporate Purple',
    description: 'Modern OdooKRD purple and gold corner composition.',
    svg: String.raw`<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1697" viewBox="0 0 2400 1697">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#714b67"/><stop offset="1" stop-color="#2f2440"/></linearGradient></defs>
<rect width="2400" height="1697" fill="#ffffff"/>
<path d="M0 0h620L280 370 0 700Z" fill="url(#g)"/>
<path d="M2400 1697h-620l340-370 280-330Z" fill="url(#g)"/>
<path d="M0 0h450L120 360Z" fill="#c9a85a" opacity=".95"/>
<path d="M2400 1697h-450l330-360Z" fill="#c9a85a" opacity=".95"/>
<g fill="none" stroke="#714b67" opacity=".08" stroke-width="2"><path d="M150 1200 500 900 820 1180 520 1460Z"/><path d="M1580 260 1890 80 2220 330 1910 560Z"/></g>
<g fill="#714b67" opacity=".06"><circle cx="350" cy="1500" r="5"/><circle cx="390" cy="1500" r="5"/><circle cx="430" cy="1500" r="5"/><circle cx="470" cy="1500" r="5"/><circle cx="2050" cy="210" r="5"/><circle cx="2090" cy="210" r="5"/><circle cx="2130" cy="210" r="5"/></g>
</svg>`,
  },
  {
    key: 'style-3',
    name: 'Style 3 — Minimal Gold',
    description: 'Clean formal certificate with restrained gold framing.',
    svg: String.raw`<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1697" viewBox="0 0 2400 1697">
<defs><linearGradient id="gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d6d2c"/><stop offset=".5" stop-color="#d8bd75"/><stop offset="1" stop-color="#8d6d2c"/></linearGradient></defs>
<rect width="2400" height="1697" fill="#fffdf8"/>
<path d="M0 0h2400v34H0zM0 1663h2400v34H0z" fill="url(#gold)" opacity=".78"/>
<path d="M0 0h34v1697H0zM2366 0h34v1697h-34z" fill="url(#gold)" opacity=".78"/>
<g fill="none" stroke="#b8964f" opacity=".16" stroke-width="2"><circle cx="160" cy="160" r="120"/><circle cx="2240" cy="160" r="120"/><circle cx="160" cy="1537" r="120"/><circle cx="2240" cy="1537" r="120"/><path d="M160 40v240M40 160h240M2240 40v240M2120 160h240M160 1417v240M40 1537h240M2240 1417v240M2120 1537h240"/></g>
<g fill="#b8964f" opacity=".06"><path d="M0 0 430 0 0 430Z"/><path d="M2400 1697h-430l430-430Z"/></g>
</svg>`,
  },
  {
    key: 'style-4',
    name: 'Style 4 — Clean White',
    description: 'Minimal white certificate with subtle OdooKRD geometry.',
    svg: String.raw`<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1697" viewBox="0 0 2400 1697">
<rect width="2400" height="1697" fill="#ffffff"/>
<g fill="none" stroke="#714b67" opacity=".08" stroke-width="2"><path d="M0 420C350 250 620 250 900 430S1450 620 1800 430 2200 240 2400 330"/><path d="M0 470C350 300 620 300 900 480S1450 670 1800 480 2200 290 2400 380"/><path d="M0 520C350 350 620 350 900 530S1450 720 1800 530 2200 340 2400 430"/></g>
<g fill="#714b67" opacity=".045"><path d="M0 1250 500 1697H0Z"/><path d="m2400 0-520 420L2400 700Z"/></g>
<g fill="#c9a85a" opacity=".5"><rect x="150" y="140" width="180" height="4" rx="2"/><rect x="2070" y="1553" width="180" height="4" rx="2"/></g>
</svg>`,
  },
];

export function listTrainingCertificateBackgroundPresets() {
  return presets.map((preset) => ({
    key: preset.key,
    name: preset.name,
    description: preset.description,
    artworkPath: `/training/certificate-templates/presets/${preset.key}/artwork`,
  }));
}

export function getTrainingCertificateBackgroundPreset(
  key: string | null | undefined,
): TrainingCertificateBackgroundPreset | null {
  if (!key) return null;
  return presets.find((preset) => preset.key === key) ?? null;
}

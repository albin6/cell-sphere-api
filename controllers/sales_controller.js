import AsyncHandler from "express-async-handler";
import SalesReport from "../models/salesModel.js";
import PdfPrinter from "pdfmake";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit-table";
import Order from "../models/orderModel.js";

const getSalesReportData = async (startDate, endDate, period) => {
  let dateFilter = {};

  if (period === "custom" && startDate && endDate) {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);
    dateFilter = { orderDate: { $gte: new Date(start), $lte: new Date(end) } };
  }

  if (period === "daily") {
    dateFilter = {
      orderDate: {
        $gte: new Date(new Date().setHours(0, 0, 0)),
        $lt: new Date(),
      },
    };
  } else if (period === "weekly") {
    dateFilter = {
      orderDate: {
        $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        $lt: new Date(),
      },
    };
  } else if (period === "monthly") {
    dateFilter = {
      orderDate: {
        $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        $lt: new Date(),
      },
    };
  } else if (period === "yearly") {
    dateFilter = {
      orderDate: {
        $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        $lt: new Date(),
      },
    };
  }

  return await SalesReport.find(dateFilter);
};

export const get_sales_report = AsyncHandler(async (req, res) => {
  const {
    startDate = null,
    endDate = null,
    period = "daily",
    page = 1,
    limit = 10,
  } = req.query;

  const skip = (page - 1) * limit;

  let dateFilter = {};

  if (period === "custom" && startDate && endDate) {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);
    dateFilter = { orderDate: { $gte: new Date(start), $lte: new Date(end) } };
  }

  if (period === "daily") {
    dateFilter = {
      orderDate: {
        $gte: new Date(new Date().setHours(0, 0, 0)),
        $lt: new Date(),
      },
    };
  } else if (period === "weekly") {
    dateFilter = {
      orderDate: {
        $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        $lt: new Date(),
      },
    };
  } else if (period === "monthly") {
    dateFilter = {
      orderDate: {
        $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        $lt: new Date(),
      },
    };
  } else if (period === "yearly") {
    dateFilter = {
      orderDate: {
        $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        $lt: new Date(),
      },
    };
  }

  const total_sales_report_count = await SalesReport.countDocuments(dateFilter);
  const totalPages = Math.ceil(total_sales_report_count / limit);
  const reports = await SalesReport.find(dateFilter)
    .populate("product")
    .populate("customer")
    .skip(skip)
    .limit(limit);

  const report_data = await SalesReport.find(dateFilter);

  const totalSalesCount = reports.length;
  const totalOrderAmount = report_data.reduce(
    (acc, report) => acc + report.finalAmount,
    0
  );
  const totalDiscount = report_data.reduce((acc, report) => {
    const reportDiscount = report.product.reduce((productAcc, product) => {
      return productAcc + product.discount + product.couponDeduction;
    }, 0);
    return acc + reportDiscount;
  }, 0);

  res.status(200).json({
    reports,
    totalSalesCount,
    totalOrderAmount,
    totalDiscount,
    totalPages,
    page,
  });
});

export const download_sales_report_pdf = AsyncHandler(async (req, res) => {
  const { startDate, endDate, period } = req.query;
  const reports = await getSalesReportData(startDate, endDate, period);

  const pdfDoc = new PDFDocument({ margin: 50, size: "A4" });
  res.setHeader("Content-Disposition", "attachment; filename=sales_report.pdf");
  pdfDoc.pipe(res);

  pdfDoc.fontSize(20).text("Sales Report", { align: "center" }).moveDown(2);

  for (let index = 0; index < reports.length; index++) {
    const report = reports[index];

    if (pdfDoc.y > 700) {
      pdfDoc.addPage();
    }

    pdfDoc.fontSize(14).font("Helvetica-Bold");
    pdfDoc.text(`Report ${index + 1}:`).moveDown(0.5);

    pdfDoc.fontSize(10).font("Helvetica");
    // Order details
    pdfDoc.text(
      `Order Date: ${new Date(report.orderDate).toLocaleDateString()}`
    );
    pdfDoc.text(`Customer Name: ${report.customer_name}`);
    pdfDoc.text(`Payment Method: ${report.paymentMethod}`);
    pdfDoc.text(`Delivery Status: ${report.deliveryStatus}`).moveDown(0.5);

    // Product table
    const table = {
      title: "Product Details",
      headers: [
        "Product Name",
        "Quantity",
        "Unit Price (RS)",
        "Total Price (RS)",
        "Discount (RS)",
        "Coupon (RS)",
      ],
      rows: report.product.map((p) => [
        p.productName,
        p.quantity.toString(),
        p.unitPrice.toFixed(2),
        p.totalPrice.toFixed(2),
        p.discount.toFixed(2),
        p.couponDeduction.toFixed(2),
      ]),
    };

    await pdfDoc.table(table, {
      prepareHeader: () => pdfDoc.font("Helvetica-Bold").fontSize(8),
      prepareRow: (row, i) => pdfDoc.font("Helvetica").fontSize(8),
      width: 500,
      columnsSize: [140, 50, 70, 70, 70, 70],
    });

    pdfDoc.moveDown(0.5);
    pdfDoc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(`Final Amount: RS. ${report.finalAmount.toFixed(2)}`);
    pdfDoc.moveDown();
  }

  pdfDoc.end();
});

export const download_sales_report_xl = AsyncHandler(async (req, res) => {
  const { startDate, endDate, period } = req.query;
  const reports = await getSalesReportData(startDate, endDate, period);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sales Report");

  worksheet.columns = [
    { header: "Product Name", key: "productName", width: 25 },
    { header: "Quantity", key: "quantity", width: 10 },
    { header: "Unit Price", key: "unitPrice", width: 15 },
    { header: "Total Price", key: "totalPrice", width: 15 },
    { header: "Discount", key: "discount", width: 15 },
    { header: "Coupon Deduction", key: "couponDeduction", width: 15 },
    { header: "Final Amount", key: "finalAmount", width: 15 },
    { header: "Order Date", key: "orderDate", width: 20 },
    { header: "Customer Name", key: "customer_name", width: 20 },
    { header: "Payment Method", key: "paymentMethod", width: 20 },
    { header: "Delivery Status", key: "deliveryStatus", width: 15 },
  ];

  reports.forEach((report) => {
    const products = report.product.map((p) => ({
      productName: p.productName,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      totalPrice: p.totalPrice,
      discount: p.discount,
      couponDeduction: p.couponDeduction,
    }));
    products.forEach((product) => {
      worksheet.addRow({
        productName: product.productName,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
        totalPrice: product.totalPrice,
        discount: product.discount,
        couponDeduction: product.couponDeduction,
        finalAmount: report.finalAmount,
        orderDate: report.orderDate.toLocaleDateString(),
        customer_name: report.customer_name,
        paymentMethod: report.paymentMethod,
        deliveryStatus: report.deliveryStatus,
      });
    });
  });

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=sales_report.xlsx"
  );
  await workbook.xlsx.write(res);
  res.end();
});

// ========================================================================

const fonts = {
  Roboto: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

export const generate_order_invoice = AsyncHandler(async (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.user.id;

  const order = await Order.findOne({ _id: orderId, user: userId })
    .populate("user", "first_name last_name email")
    .populate("order_items.product", "name");

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const printer = new PdfPrinter(fonts);

  const docDefinition = {
    content: [
      {
        columns: [
          {
            width: "*",
            text: "INVOICE",
            style: "header",
          },
          {
            width: "auto",
            table: {
              widths: ["auto", "auto"],
              body: [
                [
                  "Order Date:",
                  { text: order.placed_at.toLocaleDateString(), bold: true },
                ],
                [
                  "Delivery By:",
                  {
                    text: order.delivery_by.toLocaleDateString(),
                    bold: true,
                  },
                ],
              ],
            },
            layout: "noBorders",
          },
        ],
      },
      {
        canvas: [{ type: "line", x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 2 }],
      },
      {
        columns: [
          {
            width: "*",
            text: "Bill To",
            style: "subheader",
          },
          {
            width: "*",
            text: "Ship To",
            style: "subheader",
          },
        ],
      },
      {
        columns: [
          {
            width: "*",
            text: [
              {
                text: `${order.user.first_name} ${order.user.last_name}\n`,
                bold: true,
              },
              order.user.email,
            ],
          },
          {
            width: "*",
            text: [
              {
                text: `${order.shipping_address.address_type}\n`,
                bold: true,
              },
              `${order.shipping_address.address}\n`,
              `${order.shipping_address.district}, ${order.shipping_address.state} ${order.shipping_address.zip}\n`,
              `Phone: ${order.shipping_address.phone}`,
            ],
          },
        ],
      },
      { text: "Order Details", style: "subheader", margin: [0, 20, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Product", style: "tableHeader" },
              { text: "Variant", style: "tableHeader" },
              { text: "Qty", style: "tableHeader" },
              { text: "Price", style: "tableHeader" },
              { text: "Discount", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Status", style: "tableHeader" },
            ],
            ...order.order_items.map((item) => [
              item.product.name,
              item.variant,
              item.quantity.toString(),
              `RS :${item.price.toFixed(2)}`,
              `${(((item.price - item.total_price) / item.price) * 100).toFixed(
                0
              )}%`,
              `RS :${item.total_price.toFixed(2)}`,
              { text: item.order_status, bold: true },
            ]),
          ],
        },
      },
      {
        columns: [
          { width: "*", text: "" },
          {
            width: "auto",
            style: "totals",
            table: {
              widths: ["auto", "auto"],
              body: [
                [
                  {
                    text: "Order Summary",
                    style: "subheader",
                    colSpan: 2,
                    alignment: "center",
                  },
                  {},
                ],
                [
                  "Subtotal:",
                  {
                    text: `RS :${order.total_amount.toFixed(2)}`,
                    alignment: "right",
                  },
                ],
                [
                  "Shipping Fee:",
                  {
                    text: `RS :${order.shipping_fee.toFixed(2)}`,
                    alignment: "right",
                  },
                ],
                ...(order.coupon_discount
                  ? [
                      [
                        "Coupon Discount:",
                        {
                          text: `RS :${order.coupon_discount.toFixed(2)}`,
                          alignment: "right",
                        },
                      ],
                    ]
                  : []),
                [
                  { text: "Total:", bold: true },
                  {
                    text: `RS :${order.total_price_with_discount.toFixed(2)}`,
                    bold: true,
                    alignment: "right",
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: function (i, node) {
                return i === 0 || i === node.table.body.length ? 2 : 1;
              },
              vLineWidth: function (i, node) {
                return 0;
              },
              hLineColor: function (i, node) {
                return i === 0 || i === node.table.body.length
                  ? "black"
                  : "gray";
              },
              paddingLeft: function (i, node) {
                return 10;
              },
              paddingRight: function (i, node) {
                return 10;
              },
              paddingTop: function (i, node) {
                return 5;
              },
              paddingBottom: function (i, node) {
                return 5;
              },
            },
          },
        ],
      },
      {
        text: "Payment Information",
        style: "subheader",
        margin: [0, 20, 0, 5],
      },
      {
        table: {
          widths: ["auto", "*"],
          body: [
            ["Payment Method:", { text: order.payment_method, bold: true }],
            ["Payment Status:", { text: order.payment_status, bold: true }],
          ],
        },
        layout: {
          hLineWidth: function (i, node) {
            return i === 0 || i === node.table.body.length ? 2 : 1;
          },
          vLineWidth: function (i, node) {
            return 0;
          },
          hLineColor: function (i, node) {
            return i === 0 || i === node.table.body.length ? "black" : "gray";
          },
          paddingLeft: function (i, node) {
            return 10;
          },
          paddingRight: function (i, node) {
            return 10;
          },
          paddingTop: function (i, node) {
            return 5;
          },
          paddingBottom: function (i, node) {
            return 5;
          },
        },
      },
    ],
    styles: {
      header: {
        fontSize: 28,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      subheader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5],
      },
      tableHeader: {
        bold: true,
        fontSize: 13,
        color: "black",
      },
      totals: {
        margin: [0, 30, 0, 0],
      },
    },
    defaultStyle: {
      fontSize: 10,
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${orderId}.pdf`
  );

  pdfDoc.pipe(res);
  pdfDoc.end();
});

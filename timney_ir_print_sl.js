/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/render', 'N/search', 'N/file', 'N/runtime'], (render, search, file, runtime) => {

    function onRequest(context) {
        const params = context.request.parameters;
        const irId = params.irId;

        if (!irId) {
            context.response.write('Error: Missing Item Receipt ID.');
            return;
        }

        try {
            const itemreceiptSearchObj = search.create({
                type: "itemreceipt",
                filters: [
                    ["type", "anyof", "ItemRcpt"],
                    "AND",
                    ["taxline", "is", "F"],
                    "AND",
                    ["shipping", "is", "F"],
                    "AND",
                    ["cogs", "is", "F"],
                    "AND",
                    ["mainline", "is", "F"],
                    "AND",
                    ["internalidnumber", "equalto", irId]
                ],
                columns: [
                    search.createColumn({ name: "tranid" }),
                    search.createColumn({ name: "trandate" }),
                    search.createColumn({ name: "item" }),
                    search.createColumn({ name: "quantity" }),
                    search.createColumn({ name: "custbody_fam_specdeprjrn_rate" }),
                    search.createColumn({
                        name: "salesdescription",
                        join: "item"
                    }),
                    search.createColumn({ name: "unit" }),
                    search.createColumn({
                        name: "binnumber",
                        join: "inventoryDetail"
                    }),
                    search.createColumn({ name: "location" }),
                    search.createColumn({ name: "createdfrom" })
                ]
            });

            const searchResult = itemreceiptSearchObj.run().getRange({ start: 0, end: 100 });

            if (!searchResult || searchResult.length === 0) {
                log.error('No results found', `IR ID: ${irId}`);
                context.response.write('Error: No data found for this Item Receipt. Please check if the record exists and has line items.');
                return;
            }

            const data = {
                tranid: searchResult[0].getValue({ name: 'tranid' }) || '',
                trandate: searchResult[0].getValue({ name: 'trandate' }) || '',
                items: []
            };

            searchResult.forEach(result => {
                data.items.push({
                    item: result.getText({ name: 'item' }) || result.getValue({ name: 'item' }) || '',
                    description: result.getValue({ name: 'salesdescription', join: 'item' }) || '',
                    quantity: result.getValue({ name: 'quantity' }) || '0',
                    uom: result.getText({ name: 'unit' }) || result.getValue({ name: 'unit' }) || '',
                    rate: result.getValue({ name: 'custbody_fam_specdeprjrn_rate' }) || '',
                    location: result.getText({ name: 'location' }) || result.getValue({ name: 'location' }) || '',
                    binNumber: result.getText({ name: 'binnumber', join: 'inventoryDetail' }) || result.getValue({ name: 'binnumber', join: 'inventoryDetail' }) || '',
                    woNumber: result.getText({ name: 'createdfrom' }) || ''
                });
            });

            const renderer = render.create();

//             const xmlTemplate = `<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
// <pdf>
// <head>
//     <style type="text/css">
//         body { font-family: sans-serif; font-size: 9pt; margin: 0; padding: 0.05in; }
//         .wrapper-table { width: 100%; height: 98%; page-break-after: always; }
//         .wrapper-cell { border: 1px solid black; vertical-align: top; padding: 5px; }
        
//         .header-table { width: 100%; border-bottom: 2px solid black; margin-bottom: 5px; padding-bottom: 5px; }
//         .item-section { width: 100%; border-bottom: 2px solid black; margin-bottom: 5px; padding-bottom: 5px; }
//         .details-table { width: 100%; border-bottom: 2px solid black; margin-bottom: 5px; padding-bottom: 5px; }
//     </style>
// </head>
// <body padding="0" size="3in 3in">
// <#list record.items as item>
//     <table class="wrapper-table" cellpadding="0" cellspacing="0">
//         <tr>
//             <td class="wrapper-cell">
//                 <table class="header-table" cellpadding="0" cellspacing="0">
//                     <tr>
//                         <td style="font-size: 14pt; font-weight: bold;">IR - \${record.tranid}</td>
//                         <td style="font-size: 11pt; font-weight: bold; text-align: right;">\${record.trandate}</td>
//                     </tr>
//                 </table>
                
//                 <table class="item-section" cellpadding="0" cellspacing="0">
//                     <tr>
//                         <td style="width: 20px; font-size: 8pt; font-weight: bold; vertical-align: top; padding-top: 2px; line-height: 1.2;">
//                             I<br/>T<br/>E<br/>M<br/>:
//                         </td>
//                         <td style="vertical-align: top; padding-left: 5px;">
//                             <span style="font-size: 14pt; font-weight: bold;">\${item.item}</span><br/>
//                             <span style="font-size: 8pt; color: #333;">\${item.description}</span>
//                         </td>
//                     </tr>
//                 </table>
                
//                 <table class="details-table" cellpadding="0" cellspacing="0">
//                     <tr>
//                         <td width="33%" align="left" style="font-size: 10pt; padding: 3px 0;"><b>QTY:</b> \${item.quantity}</td>
//                         <td width="33%" align="left" style="font-size: 10pt; padding: 3px 0;"><b>UOM:</b> \${item.uom}</td>
//                         <td width="34%" align="left" style="font-size: 10pt; padding: 3px 0;"><b>RATE:</b> \${item.rate}</td>
//                     </tr>
//                     <tr>
//                         <td colspan="3" align="left" style="font-size: 10pt; padding: 3px 0;"><b>LOC:</b> \${item.location}</td>
//                     </tr>
//                     <tr>
//                         <td colspan="3" align="left" style="font-size: 10pt; padding: 3px 0;"><b>BIN:</b> \${item.binNumber}</td>
//                     </tr>
//                     <tr>
//                         <td colspan="3" align="left" style="font-size: 10pt; padding: 3px 0;"><b>WO:</b> \${item.woNumber}</td>
//                     </tr>
//                 </table>
                
//                 <table style="width: 100%; margin-top: 5px;" cellpadding="0" cellspacing="0">
//                     <tr>
//                         <td align="center">
//                             <barcode codetype="code128" showtext="true" value="\${item.item}" width="2.5in" height="0.4in"/>
//                         </td>
//                     </tr>
//                 </table>
//             </td>
//         </tr>
//     </table>
// </#list>
// </body>
// </pdf>`;


          const xmlTemplate = `<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
<head>
    <style type="text/css">
        body {
            font-family: sans-serif;
            font-size: 9pt;
            margin: 0;
            padding: 0;
        }

        .wrapper-table {
            width: 100%;
            height: 100%;
            page-break-after: always;
        }

        .wrapper-cell {
            border: 1px solid black;
            vertical-align: top;
            padding: 0;
        }

        .header-table {
            width: 100%;
            border-bottom: 1px solid black;
        }

        .item-section {
            width: 100%;
            border-bottom: 1px solid black;
        }

        .details-table {
            width: 100%;
            border-bottom: 1px solid black;
        }

        .label-padding {
            padding-left: 8px;
            padding-right: 8px;
        }

        .bold {
            font-weight: bold;
        }
    </style>
</head>

<body padding="0" size="3in 3in">
<#list record.items as item>

    <table class="wrapper-table" cellpadding="0" cellspacing="0">
        <tr>
            <td class="wrapper-cell">

                <!-- Header -->
                <table class="header-table" cellpadding="0" cellspacing="0">
                    <tr>
                        <td class="label-padding" style="font-size: 15pt; font-weight: bold; padding-top: 8px; padding-bottom: 7px;">
                            IR - \${record.tranid}
                        </td>
                        <td class="label-padding" align="right" style="font-size: 10pt; font-weight: bold; padding-top: 10px; padding-bottom: 7px;">
                            \${record.trandate}
                        </td>
                    </tr>
                </table>

                <!-- Item Section -->
                <table class="item-section" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="width: 30px; padding-left: 8px; padding-top: 5px; vertical-align: top;">
                            <span style="font-size: 8pt; font-weight: bold; line-height: 9pt;">
                                I<br/>T<br/>E<br/>M<br/>:
                            </span>
                        </td>

                        <td style="padding-top: 5px; padding-bottom: 7px; vertical-align: top;">
                            <span style="font-size: 18pt; font-weight: bold;">
                                \${item.item}
                            </span>
                            <br/>
                            <span style="font-size: 8pt; font-weight: bold;">
                                \${item.description}
                            </span>
                        </td>
                    </tr>
                </table>

                <!-- Details Section -->
                <table class="details-table" cellpadding="0" cellspacing="0">
                    <tr>
                        <td class="label-padding" style="width: 33%; font-size: 10pt; padding-top: 6px;">
                            <b>QTY:</b>&nbsp;&nbsp;\${item.quantity}
                        </td>
                        <td style="width: 33%; font-size: 10pt; padding-top: 6px;">
                            <b>UOM:</b>&nbsp;&nbsp;\${item.uom}
                        </td>
                        <td style="width: 34%; font-size: 10pt; padding-top: 6px;">
                            <b>RATE:</b>&nbsp;&nbsp;\${item.rate}
                        </td>
                    </tr>

                    <tr>
                        <td colspan="3" class="label-padding" style="font-size: 10pt; padding-top: 8px;">
                            <b>LOC:</b>&nbsp;&nbsp;\${item.location}
                        </td>
                    </tr>

                    <tr>
                        <td colspan="2" class="label-padding" style="font-size: 10pt; padding-top: 8px; padding-bottom: 8px;">
                            <b>BIN:</b>&nbsp;&nbsp;\${item.binNumber}
                        </td>
                        <td style="font-size: 10pt; padding-top: 8px; padding-bottom: 8px;">
                            <b>WO:</b>&nbsp;&nbsp;\${item.woNumber}
                        </td>
                    </tr>
                </table>

                <!-- Barcode Section -->
                <table style="width: 100%;" cellpadding="0" cellspacing="0">
                    <tr>
                        <td align="center" style="padding-top: 13px;">
                            <barcode codetype="code128" showtext="false" value="\${item.item}" width="2.55in" height="0.38in"/>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="font-size: 8pt; padding-top: 2px;">
                            \${item.item}
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>

</#list>
</body>
</pdf>`;

          
            renderer.templateContent = xmlTemplate;
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'record',
                data: data
            });

            const pdfFile = renderer.renderAsPdf();
            pdfFile.name = `Label_IR_${irId}.pdf`;

            context.response.writeFile({
                file: pdfFile,
                isInline: true
            });

        } catch (e) {
            log.error('Error printing IR label', e);
            context.response.write(`Error: ${e.message}`);
        }
    }

    return { onRequest };
});

const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            // Replace $ followed by number: $10 -> ₹10
            content = content.replace(/\$(\d)/g, '₹$1');
            // Replace $ followed by space and number: $ 10 -> ₹ 10
            content = content.replace(/\$ (\d)/g, '₹ $1');
            // Replace JSX dollar signs: >${var} -> >₹{var}
            content = content.replace(/>\s*\$\{/g, '>₹{');
            // Replace specific total/price cases: price: '$' -> price: '₹'
            content = content.replace(/:\s*['"]\$(\d+)/g, ': \'₹$1');
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated ' + fullPath);
            }
        }
    }
}

processDir('d:/mara project/Go2Pick/admin-panel/src');

"""Optional Chromium integration smoke test that bundles local ESM inline.

Designed for restricted CI/agent environments where Chromium navigation to any
URL (including localhost and file://) is blocked. It is NOT a full test of
GitHub Pages HTTP module delivery, so manually check deployment as well.

Requires: pip install playwright + a locally installed Chromium binary.
"""
from pathlib import Path
import re
import json
import os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
ORDER=['engine.js','analysis.js','tracker.js','io.js','render.js','main.js']
def inline_html():
    html=(ROOT/'index.html').read_text()
    css=(ROOT/'styles.css').read_text()
    script='\n'.join(re.sub(r'\bexport\s+(?=(?:async\s+)?(?:const|function|class|let)\b)','',re.sub(r'^import\s+.*?;\s*$', '', (ROOT/'src'/name).read_text(), flags=re.M)) for name in ORDER)
    html=re.sub(r'<link rel="stylesheet"[^>]*>', lambda _: '<style>'+css+'</style>',html)
    html=re.sub(r'<script type="module"[^>]*></script>',lambda _: '<script type="module">\n'+script+'\n</script>',html)
    return html

def run():
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'), headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        for width,height,label in [(1440,950,'desktop'),(390,844,'mobile')]:
            page=browser.new_page(viewport={'width':width,'height':height},accept_downloads=True)
            errors=[]
            page.on('pageerror', lambda e:errors.append(str(e)))
            page.set_content(inline_html(),wait_until='load')
            page.wait_for_function('window.__realityforkTest?.getState?.() !== undefined',timeout=20000)
            page.wait_for_timeout(250)
            assert page.title().startswith('RealityFork')
            assert page.evaluate('window.__realityforkTest.getState().sourceType')=='synthetic'
            page.locator('#heroMoon').click()
            assert abs(page.evaluate('window.__realityforkTest.getState().settings.gravity')-.165)<.0001
            page.locator('[data-mode="time"]').click()
            page.locator('[data-speed="2"]').click()
            assert page.evaluate('window.__realityforkTest.getState().settings.speed')==2
            page.locator('#stepNext').click()
            assert page.evaluate('window.__realityforkTest.getState().time')>0
            page.locator('[data-mode="material"]').click()
            page.locator('[data-material="Rubber"]').click()
            assert page.evaluate('window.__realityforkTest.getState().settings.restitution')==.9
            page.locator('[data-mode="wind"]').click()
            page.locator('[data-wind="5"]').click()
            assert page.evaluate('window.__realityforkTest.getState().settings.wind')==5
            page.locator('[data-mode="motion"]').click()
            page.locator('#graphVariable').select_option('speed')
            page.locator('[data-mode="share"]').click()
            with page.expect_download(timeout=15000) as event: page.locator('#jsonBtn').click()
            d=event.value
            assert d.suggested_filename.endswith('.json')
            with page.expect_download(timeout=15000) as event: page.locator('#pngBtn').click()
            assert event.value.suggested_filename.endswith('.png')
            # Export/import a real file, not just an object-level serializer.
            json_path=str(ROOT/'assets'/'realityfork-test-export.json')
            d.save_as(json_path)
            page.locator('#importFile').set_input_files(json_path)
            page.wait_for_timeout(250)
            assert abs(page.evaluate('window.__realityforkTest.getState().settings.gravity')-.165)<.0001
            page.locator('[data-mode=gravity]').click()
            page.evaluate('window.__realityforkTest.pause();window.__realityforkTest.seekTime(2.0)')
            sizes=page.evaluate('({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})')
            assert sizes['scroll']<=sizes['client']+1, f'Horizontal overflow at {width}: {sizes}'
            (ROOT/'assets').mkdir(exist_ok=True)
            page.screenshot(path=str(ROOT/'assets'/f'realityfork-{label}.png'),full_page=True,animations='disabled')
            assert not errors,errors
            print('PASS',label,'all six modes, gravity/material/wind/time interactions, downloads, no JS errors, no sideways overflow')
            if label=='desktop':
                page.locator('#videoFile').set_input_files(str(ROOT/'assets'/'synthetic-ball-test.webm'))
                page.wait_for_function('window.__realityforkTest.getState().sourceType === "video"',timeout=10000)
                page.wait_for_timeout(400)
                # Known high-contrast orange ball at t=0.8s at approx x117/320, y125/200.
                page.evaluate('window.__realityforkTest.seekTime(0.8)')
                page.wait_for_timeout(600)
                canvas=page.locator('#realCanvas')
                box=canvas.bounding_box()
                # Canvas uses 900x506, video frame uses 810x506, horizontally centred with x-offset 45.
                cx=(45+117*2.53)/900*box['width']; cy=(125*2.53)/506*box['height']
                canvas.click(position={'x':cx,'y':cy})
                assert page.locator('#trackBtn').is_enabled(),'Color selection failed'
                page.locator('#trackBtn').click()
                page.wait_for_function('window.__realityforkTest.getState().observations >= 5',timeout=90000)
                points=page.evaluate('window.__realityforkTest.getState().observations')
                assert points>=5
                page.locator('[data-mode="motion"]').click()
                with page.expect_download(timeout=12000) as event:page.locator('#csvBtn').click()
                assert event.value.suggested_filename.endswith('.csv')
                page.screenshot(path=str(ROOT/'assets'/'realityfork-video.png'),full_page=True,animations='disabled')
                print('PASS local synthetic video tracking',points,'observations, calibrated graph mode, CSV export')
            page.close()
        browser.close()
if __name__=='__main__':run()

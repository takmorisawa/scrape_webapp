import os
import sys

root=os.path.dirname(os.path.abspath(__file__))
root=os.path.dirname(root)
root=root+"/supported_devices"

sys.path.append(root)

from auto_gen.crowl import *
from auto_gen.scrape import *
from auto_gen.backup import *
from mvno.ocn.postprocess import *

def scrape_ocn():
    crowl(root,"mvno/ocn/crowl.config")
    scrape(root,"mvno/ocn/scrape.config")
    backup(root+"/mvno/ocn/tmp",root+"/mvno/ocn/current")
    postprocess()

if __name__=="__main__":
    scrape_ocn()
